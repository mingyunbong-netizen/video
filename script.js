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
const FIXED_POSITION_Y = -4.0;  // ⬅️ Y축 위치: -4.0으로 고정했습니다.
const FIXED_POSITION_Z = 0.0;   // Z축 위치: 0.0으로 고정됩니다.
const MODEL_SPACING_X = 3.0;    // ⬅️ X축 모델 간의 간격입니다.
// 🌟🌟🌟 ------------------------------------ 🌟🌟🌟


// 1. 기본 3요소 설정
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // ⬅️ 배경색: 순수 흰색 (HTML CSS와 통일!)

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
// Y축 -4.0 위치를 중심으로 볼 수 있도록 카메라 위치 조정
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
const startX = -((modelCount - 1) * MODEL_SPACING_X) / 2; 

modelsToLoad.forEach((modelInfo, index) => {
    loader.load(
        modelInfo.name,
        function (gltf) {
            const model = gltf.scene;

            // X축 일렬 위치 계산
            model.position.x = startX + (index * MODEL_SPACING_X); 
            
            // Y축 (높이) = -4.0 고정
            model.position.y = FIXED_POSITION_Y; 
            
            // Z축 (깊이) = 0.0 고정
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

// --- 8. 웹캠 및 2D 영상 기능 추가 (통합 로직) ---

const myVideo = document.getElementById('my-video');
const videoInfo = document.getElementById('video-info');

const webcamFeed = document.getElementById('webcam-feed');
const webcamLoading = document.getElementById('webcam-loading');


// 1. 2D 영상 자동 재생 우회
function attemptVideoPlay() {
    // 3D 캔버스가 아닌, 2D 영상 패널에 클릭 이벤트를 추가합니다.
    myVideo.style.display = 'block'; 
    videoInfo.style.display = 'none';

    myVideo.play().catch(error => {
        // 자동 재생 실패 시 (Chrome 정책 등)
        myVideo.style.display = 'none';
        videoInfo.style.display = 'block';
        videoInfo.textContent = '⛔ 영상 자동 재생 실패! 화면을 클릭하여 재생하세요.';
        
        // 3D 캔버스 클릭 시 영상 재생 시도
        document.body.addEventListener('click', () => {
             myVideo.play().then(() => {
                myVideo.style.display = 'block'; 
                videoInfo.style.display = 'none';
            }).catch(() => {
                videoInfo.textContent = '❌ 웹사이트 상호작용 후 다시 시도하세요.';
            });
        }, { once: true });
    });
}

// 2. 웹캠 시작 함수
function startWebcam() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                // 성공적으로 스트림을 받았을 때
                webcamFeed.srcObject = stream;
                webcamLoading.style.display = 'none';
                webcamFeed.style.display = 'block';
                console.log("웹캠 스트림 시작 완료.");
            })
            .catch(function(error) {
                // 권한 거부 또는 장치 없을 때
                console.error("웹캠 접근 에러:", error);
                webcamLoading.textContent = "❌ 웹캠 접근 권한이 거부되었습니다.";
            });
    } else {
        webcamLoading.textContent = "❌ 이 브라우저는 웹캠 접근을 지원하지 않습니다.";
    }
}

// 3. 페이지 로드 완료 시 웹캠 및 영상 재생 시작
window.onload = function() {
    startWebcam();
    attemptVideoPlay();
}
