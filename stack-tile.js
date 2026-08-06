const firebaseConfig={
  apiKey:"AIzaSyBu2RrQn8cAwwWaLtw5O8Omwn4-NzHWuc0",
  authDomain:"kor-app-fa47e.firebaseapp.com",
  projectId:"kor-app-fa47e",
  storageBucket:"kor-app-fa47e.firebasestorage.app",
  messagingSenderId:"397749083935",
  appId:"1:397749083935:web:51c7c"
};

if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);

firebase.firestore().settings({
  experimentalForceLongPolling:true,
  useFetchStreams:false
});

window.db=firebase.firestore();

window.state={
  currentUser:localStorage.getItem("stackTilePublicNickname")||"",
  escapeLabyrinthTab:"stackTile"
};

window.escapeHtml=function(s){
  return String(s??"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/\"/g,"&quot;")
    .replace(/'/g,"&#39;");
};

window.updateEscapeLabyrinthHomePanels=function(){};

function syncPublicStackTileNickname(){
  const nickname=state.currentUser||"";
  const input=document.getElementById("stackTileNicknameInput");
  const help=document.getElementById("stackTileNicknameHelp");
  const saveBtn=document.getElementById("stackTileNicknameSaveBtn");
  const clearBtn=document.getElementById("stackTileNicknameClearBtn");

  if(input)input.value=nickname;
  if(help)help.textContent=nickname?`현재 닉네임: ${nickname}`:"닉네임을 입력하면 클리어 기록이 랭킹에 저장됩니다.";
  if(saveBtn)saveBtn.textContent=nickname?"닉네임 저장":"시작하기";
  if(clearBtn)clearBtn.classList.toggle("hidden",!nickname);
}

function savePublicStackTileNickname(){
  const input=document.getElementById("stackTileNicknameInput");
  const nickname=String(input?.value||"").trim();

  if(!nickname){
    alert("닉네임을 입력하세요.");
    input?.focus();
    return;
  }

  state.currentUser=nickname;
  localStorage.setItem("stackTilePublicNickname",nickname);
  syncPublicStackTileNickname();

  if(typeof subscribeStackTileRecords==="function")subscribeStackTileRecords();
  if(typeof renderStackTileGame==="function")renderStackTileGame();
}

function clearPublicStackTileNickname(){
  state.currentUser="";
  localStorage.removeItem("stackTilePublicNickname");
  syncPublicStackTileNickname();
  document.getElementById("stackTileNicknameInput")?.focus();

  if(typeof renderStackTileGame==="function")renderStackTileGame();
}

window.savePublicStackTileNickname=savePublicStackTileNickname;
window.clearPublicStackTileNickname=clearPublicStackTileNickname;

function loadOriginalStackTileScript(){
  return new Promise((resolve,reject)=>{
    const script=document.createElement("script");
    script.src="https://foldingscreen.github.io/970KOR.github.io/js/event-stack-tile.js?v=split-15";
    script.onload=resolve;
    script.onerror=reject;
    document.body.appendChild(script);
  });
}

window.addEventListener("DOMContentLoaded",async()=>{
  syncPublicStackTileNickname();

  document.getElementById("stackTileNicknameInput")?.addEventListener("keydown",event=>{
    if(event.key==="Enter"){
      event.preventDefault();
      savePublicStackTileNickname();
    }
  });

  try{
    await loadOriginalStackTileScript();

    window.getStackTileRecordsRef=function(){
      return db.collection("publicGames").doc("stack_tile").collection("records");
    };

    if(typeof renderStackTileScreen==="function")renderStackTileScreen();
  }catch(err){
    console.error(err);
    const root=document.getElementById("stackTileRoot");
    if(root){
      root.innerHTML='<div class="stack-public-error">게임 파일을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>';
    }
  }
});
