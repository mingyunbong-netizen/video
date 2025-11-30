// main.js - 3D 모델 뷰어 최종 버전 (Y축 -2.0 고정, X축 일렬 배치)

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- 전역 변수 및 설정 ---
let intersectedObject = null; 
let isDragging = false;       
let previousMousePosition = { x: 0, y: 0 }; 
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


// 🌟🌟🌟 모델 크기 및 배치 설정 (이곳만 수정하세요!) 🌟🌟🌟
// 1. 모델 크기 정보
const modelsToLoad = [
    // [이름]           [크기]
    { name: 'shoes.glb',    scale: 10 }, 
    { name: 'bag.glb',      scale: 7 },
    { name: 'ball.glb',     scale: 5 },
    { name: 'book.glb',     scale: 10 }, 
    { name: 'close.glb',    scale: 5 },
    { name: 'glasses.glb',  scale: 20 }, 
    { name: 'guard.glb',    scale: 10 },
    { name: 'persimmon.glb',scale: 20 },
];

// 2. 고정 및 간격 설정
const FIXED_POSITION_Y = -4.0;  // ⬅️ Y축 위치: -2.0으로 고정했습니다.
const FIXED_POSITION_Z = 0.0;   // Z축 위치: 0.0으로 고정됩니다.
const MODEL_SPACING_X = 3.0;    // ⬅️ X축 모델 간의 간격입니다. 이 값을 조정하여 겹치지 않게 조절하세요.

// 🌟🌟🌟 ------------------------------------ 🌟🌟🌟


// 1. 기본 3요소 설정
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // 배경색: 순수 흰색

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
// Y축 -2.0 위치를 중심으로 볼 수 있도록 카메라 위치 조정
camera.position.set(0, 0, 15); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); 

// 2. 조명 설정
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7).normalize();
scene.add(directionalLight);

// 3. 컨트롤 설정 
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);   // 카메라가 원점(0,0,0)을 바라보게 고정
controls.enablePan = false;     
controls.enableRotate = false;  
controls.maxDistance = 20;      
controls.minDistance = 5;       


// 4. GLB 파일 로드!
const loader = new GLTFLoader(); 

// --- 💡 X축 일렬 배치 위치 자동 계산 ---
const modelCount = modelsToLoad.length;
// 모델들을 중앙(0)을 중심으로 좌우로 배치하기 위한 시작점 계산
const startX = -((modelCount - 1) * MODEL_SPACING_X) / 2; 

modelsToLoad.forEach((modelInfo, index) => {
    loader.load(
        modelInfo.name,
        function (gltf) {
            const model = gltf.scene;

            // **X축 일렬 위치 계산**
            model.position.x = startX + (index * MODEL_SPACING_X); 
            
            // **Y축 (높이) = -2.0 고정**
            model.position.y = FIXED_POSITION_Y; 
            
            // **Z축 (깊이) = 0.0 고정**
            model.position.z = FIXED_POSITION_Z; 
            
            // 모델 크기 및 userData 설정
            model.scale.set(modelInfo.scale, modelInfo.scale, modelInfo.scale);
            model.userData.modelName = modelInfo.name; 

            scene.add(model);
        },
        undefined, 
        function (error) {
            console.error(`모델 로드 중 에러 발생: ${modelInfo.name}`, error);
        }
    );
});


// 5. 마우스 이벤트 리스너 추가 (개별 회전을 위한 핵심 로직)
renderer.domElement.addEventListener('mousedown', onMouseDown, false);
renderer.domElement.addEventListener('mousemove', onMouseMove, false);
renderer.domElement.addEventListener('mouseup', onMouseUp, false);

function onMouseDown(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true); 

    if (intersects.length > 0) {
        let target = intersects[0].object;
        while (target.parent && target.parent !== scene) {
            target = target.parent;
        }

        if (target.parent === scene) {
            intersectedObject = target;
            isDragging = true;
            previousMousePosition.x = event.clientX;
            previousMousePosition.y = event.clientY;
        }
    }
}

function onMouseMove(event) {
    if (!isDragging || !intersectedObject) return;

    const deltaX = event.clientX - previousMousePosition.x;
    
    // Y축 회전 적용
    intersectedObject.rotation.y += deltaX * 0.01; 

    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
}

function onMouseUp(event) {
    isDragging = false;
    intersectedObject = null;
}


// 6. 렌더링 루프 (애니메이션)
function animate() {
    requestAnimationFrame(animate); 
    
    controls.update(); 
    
    renderer.render(scene, camera); 
}

animate();

// 7. 창 크기 변경 시 화면 비율 유지
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

