/* ============================================================
   Gramophone3D — a real Three.js scene for the player.
   Exposes window.Gramo3D = { play, pause, reset, ended, setCoverTexture }
   script.js calls these instead of toggling CSS classes.
   ============================================================ */

(function () {
    const container = document.getElementById("gramophone");
    const canvas = document.getElementById("scene3d");

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(-2.6, 2.5, 4.6);
    camera.lookAt(0, 0.55, -0.1);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    function resize() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize);

    /* ---------------- lighting ---------------- */
    scene.add(new THREE.AmbientLight(0x3a2c1a, 0.7));

    const keyLight = new THREE.DirectionalLight(0xffd9a0, 1.4);
    keyLight.position.set(-3, 5, 3);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xffe6bf, 0.6, 15);
    fillLight.position.set(3, 2, 4);
    scene.add(fillLight);

    const hornHighlight1 = new THREE.PointLight(0xfff2d0, 0.9, 8);
    hornHighlight1.position.set(-1.2, 2.6, -0.6);
    scene.add(hornHighlight1);

    const hornHighlight2 = new THREE.PointLight(0xffe0a0, 0.5, 8);
    hornHighlight2.position.set(1.0, 1.2, 1.6);
    scene.add(hornHighlight2);

    const frontFill = new THREE.PointLight(0xffe8c2, 0.35, 10);
    frontFill.position.set(0, 0.6, 3.2);
    scene.add(frontFill);

    /* a soft procedural environment so the brass/chrome picks up believable reflections */
    try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envCanvas = document.createElement("canvas");
        envCanvas.width = 64; envCanvas.height = 64;
        const ectx = envCanvas.getContext("2d");
        const grad = ectx.createLinearGradient(0, 0, 0, 64);
        grad.addColorStop(0, "#3a2410");
        grad.addColorStop(0.5, "#ffd9a0");
        grad.addColorStop(1, "#120a04");
        ectx.fillStyle = grad;
        ectx.fillRect(0, 0, 64, 64);
        const envTex = new THREE.CanvasTexture(envCanvas);
        envTex.mapping = THREE.EquirectangularReflectionMapping;
        const envRT = pmrem.fromEquirectangular(envTex);
        scene.environment = envRT.texture;
        pmrem.dispose();
    } catch (e) {
        /* environment reflections are a nice-to-have; safe to skip if unsupported */
    }

    /* ---------------- cabinet ---------------- */
    function woodTexture() {
        const c = document.createElement("canvas");
        c.width = 256; c.height = 256;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#4a2c16";
        ctx.fillRect(0, 0, 256, 256);
        for (let i = 0; i < 40; i++) {
            const y = Math.random() * 256;
            ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? "110,70,35" : "30,15,5"},${0.15 + Math.random() * 0.2})`;
            ctx.lineWidth = 1 + Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x <= 256; x += 32) {
                ctx.lineTo(x, y + (Math.random() - 0.5) * 14);
            }
            ctx.stroke();
        }
        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        tex.encoding = THREE.sRGBEncoding;
        return tex;
    }

    const cabinetMat = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.4, metalness: 0.1 });
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.55, 3.6), cabinetMat);
    cabinet.position.y = -0.275;
    scene.add(cabinet);

    const trimMat = new THREE.MeshStandardMaterial({ color: 0x8a611f, roughness: 0.35, metalness: 0.4 });
    const trim = new THREE.Mesh(new THREE.BoxGeometry(3.66, 0.06, 3.66), trimMat);
    trim.position.y = -0.03;
    scene.add(trim);

    /* soft fake reflection on the "tabletop" beneath the cabinet */
    function reflectionTexture() {
        const c = document.createElement("canvas");
        c.width = c.height = 128;
        const ctx = c.getContext("2d");
        const grad = ctx.createRadialGradient(64, 64, 5, 64, 64, 64);
        grad.addColorStop(0, "rgba(255,220,160,0.35)");
        grad.addColorStop(1, "rgba(255,220,160,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        return new THREE.CanvasTexture(c);
    }
    const reflection = new THREE.Mesh(
        new THREE.CircleGeometry(2.6, 32),
        new THREE.MeshBasicMaterial({ map: reflectionTexture(), transparent: true, depthWrite: false })
    );
    reflection.rotation.x = -Math.PI / 2;
    reflection.position.y = -0.551;
    scene.add(reflection);

    /* ---------------- turntable ---------------- */
    function grooveTexture() {
        const c = document.createElement("canvas");
        c.width = c.height = 512;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#0b0b0b";
        ctx.fillRect(0, 0, 512, 512);
        ctx.translate(256, 256);
        for (let r = 250; r > 70; r -= 3) {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255,255,255,${(r % 9 === 0) ? 0.09 : 0.035})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        const tex = new THREE.CanvasTexture(c);
        tex.encoding = THREE.sRGBEncoding;
        return tex;
    }

    const recordGeo = new THREE.CylinderGeometry(1.55, 1.55, 0.06, 96);
    const recordSideMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.35, metalness: 0.4 });
    const recordTopMat = new THREE.MeshStandardMaterial({ map: grooveTexture(), roughness: 0.55, metalness: 0.15 });
    const recordBottomMat = recordSideMat;
    const record = new THREE.Mesh(recordGeo, [recordSideMat, recordTopMat, recordBottomMat]);
    record.position.y = 0.03;
    scene.add(record);

    const labelMat = new THREE.MeshStandardMaterial({ color: 0x8a2222, roughness: 0.45, metalness: 0.1 });
    const label = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.075, 48), labelMat);
    label.position.y = 0.035;
    scene.add(label);

    const spindleMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.2, metalness: 0.9 });
    const spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 16), spindleMat);
    spindle.position.y = 0.11;
    scene.add(spindle);

    /* ---------------- horn: curved brass tube + flared lathe bell ---------------- */
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xc9a24d, roughness: 0.22, metalness: 0.9 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.15, metalness: 0.95 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.5, metalness: 0.2 });

    const neckCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.55, 0.28, 0.55),
        new THREE.Vector3(0.65, 0.65, 0.35),
        new THREE.Vector3(0.55, 1.05, -0.1),
        new THREE.Vector3(0.15, 1.35, -0.65),
        new THREE.Vector3(-0.35, 1.5, -1.05)
    ]);
    const neckTube = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 40, 0.09, 12, false), brassMat);
    scene.add(neckTube);

    const jointMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), chromeMat);
    jointMesh.position.copy(neckCurve.getPointAt(0));
    scene.add(jointMesh);

    // flared bell built with a Lathe profile, then oriented along the curve's end tangent
    const bellPoints = [];
    for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        bellPoints.push(new THREE.Vector2(0.1 + Math.pow(t, 1.4) * 0.38, t * 0.32));
    }
    const bellGeo = new THREE.LatheGeometry(bellPoints, 40);
    const bell = new THREE.Mesh(bellGeo, brassMat);

    const bellInner = new THREE.Mesh(new THREE.CircleGeometry(0.34, 40), darkMat);
    bellInner.position.y = 0.315;
    bellInner.rotation.x = -Math.PI / 2;

    const bellGroup = new THREE.Group();
    bellGroup.add(bell, bellInner);

    const endPoint = neckCurve.getPointAt(1);
    const tangent = neckCurve.getTangentAt(1).normalize();
    const upAxis = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(upAxis, tangent);
    bellGroup.quaternion.copy(quat);
    bellGroup.position.copy(endPoint);
    scene.add(bellGroup);

    /* ---------------- tonearm ---------------- */
    const armGroup = new THREE.Group();
    armGroup.position.copy(neckCurve.getPointAt(0));
    scene.add(armGroup);

    const armMat = new THREE.MeshStandardMaterial({ color: 0xd9b877, roughness: 0.3, metalness: 0.75 });
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.15, 12), armMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.x = -0.58;
    armGroup.add(arm);

    const needle = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 10), darkMat);
    needle.position.set(-1.15, -0.05, 0);
    needle.rotation.z = Math.PI;
    armGroup.add(needle);

    const pivotCap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 16), chromeMat);
    armGroup.add(pivotCap);

    const ARM_REST = 0.05;   // radians, resting off the record
    const ARM_PLAY = -0.55;  // swung over the record while playing
    armGroup.rotation.y = ARM_REST;
    let armTarget = ARM_REST;

    /* ---------------- state + animation loop ---------------- */
    let spinning = false;
    let spinSpeed = 0;
    const SPIN_MAX = 0.09;

    function animate() {
        requestAnimationFrame(animate);

        spinSpeed += ((spinning ? SPIN_MAX : 0) - spinSpeed) * 0.06;
        record.rotation.y += spinSpeed;
        label.rotation.y += spinSpeed;
        spindle.rotation.y += spinSpeed;

        armGroup.rotation.y += (armTarget - armGroup.rotation.y) * 0.05;

        renderer.render(scene, camera);
    }

    /* ---------------- public API ---------------- */
    window.Gramo3D = {
        play() {
            spinning = true;
            armTarget = ARM_PLAY;
        },
        pause() {
            spinning = false;
            armTarget = ARM_REST;
        },
        ended() {
            spinning = false;
            armTarget = ARM_REST;
        },
        reset() {
            spinning = false;
            armTarget = ARM_REST;
            armGroup.rotation.y = ARM_REST;
            record.rotation.y = 0;
            label.rotation.y = 0;
            spindle.rotation.y = 0;
            spinSpeed = 0;
        },
        setCoverTexture(dataURL) {
            if (!dataURL) {
                label.material.map = null;
                label.material.color.set(0x8a2222);
                label.material.needsUpdate = true;
                return;
            }
            new THREE.TextureLoader().load(dataURL, (tex) => {
                tex.encoding = THREE.sRGBEncoding;
                label.material.map = tex;
                label.material.color.set(0xffffff);
                label.material.needsUpdate = true;
            });
        }
    };

    if (scene.environment) {
        [brassMat, chromeMat, armMat, spindleMat].forEach((m) => {
            m.envMap = scene.environment;
            m.envMapIntensity = 1.1;
            m.needsUpdate = true;
        });
    }

    resize();
    animate();
})();
