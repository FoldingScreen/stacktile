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
  serverNumber:localStorage.getItem("stackTilePublicServerNumber")||"",
  nickname:localStorage.getItem("stackTilePublicNickname")||"",
  currentUser:"",
  escapeLabyrinthTab:"stackTile"
};

function getPublicStackTilePlayerLabel(){
  const server=String(state.serverNumber||"").trim();
  const nickname=String(state.nickname||"").trim();

  if(server&&nickname)return `${server}서버 ${nickname}`;
  return nickname;
}

function updatePublicStackTileCurrentUser(){
  state.currentUser=getPublicStackTilePlayerLabel();
}

updatePublicStackTileCurrentUser();

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
  updatePublicStackTileCurrentUser();

  const serverInput=document.getElementById("stackTileServerInput");
  const nicknameInput=document.getElementById("stackTileNicknameInput");
  const help=document.getElementById("stackTileNicknameHelp");
  const saveBtn=document.getElementById("stackTileNicknameSaveBtn");
  const clearBtn=document.getElementById("stackTileNicknameClearBtn");
  const label=state.currentUser||"";

  if(serverInput)serverInput.value=state.serverNumber||"";
  if(nicknameInput)nicknameInput.value=state.nickname||"";
  if(help)help.textContent=label?`현재 랭킹 정보: ${label}`:"서버 숫자와 닉네임을 입력하면 클리어 기록이 랭킹에 저장됩니다.";
  if(saveBtn)saveBtn.textContent=label?"정보 저장":"시작하기";
  if(clearBtn)clearBtn.classList.toggle("hidden",!label);
}

function savePublicStackTileNickname(){
  const serverInput=document.getElementById("stackTileServerInput");
  const nicknameInput=document.getElementById("stackTileNicknameInput");
  const serverNumber=String(serverInput?.value||"").trim().replace(/[^0-9]/g,"");
  const nickname=String(nicknameInput?.value||"").trim();

  if(!serverNumber){
    alert("서버 숫자를 입력하세요.");
    serverInput?.focus();
    return;
  }

  if(!nickname){
    alert("닉네임을 입력하세요.");
    nicknameInput?.focus();
    return;
  }

  state.serverNumber=serverNumber;
  state.nickname=nickname;
  updatePublicStackTileCurrentUser();

  localStorage.setItem("stackTilePublicServerNumber",serverNumber);
  localStorage.setItem("stackTilePublicNickname",nickname);

  syncPublicStackTileNickname();

  if(typeof subscribeStackTileRecords==="function")subscribeStackTileRecords();
  if(typeof renderStackTileGame==="function")renderStackTileGame();
}

function clearPublicStackTileNickname(){
  state.serverNumber="";
  state.nickname="";
  state.currentUser="";

  localStorage.removeItem("stackTilePublicServerNumber");
  localStorage.removeItem("stackTilePublicNickname");

  syncPublicStackTileNickname();
  document.getElementById("stackTileServerInput")?.focus();

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

function patchPublicStackTileRecordSaving(){
  window.getStackTileRecordsRef=function(){
    return db.collection("publicGames").doc("stack_tile").collection("records");
  };

  window.saveStackTileRecord=async function(){
    if(stackTileState.clearSaved)return;
    if(!state.currentUser)return;

    stackTileState.clearSaved=true;

    const finalScore=calculateStackTileScore();
    const clearTimeMs=getStackTileElapsedMs();
    const rawNickname=String(state.nickname||"").trim();
    const serverNumber=String(state.serverNumber||"").trim();
    const playerLabel=getPublicStackTilePlayerLabel();

    const payload={
      nickname:playerLabel,
      rawNickname,
      serverNumber,
      difficulty:stackTileState.difficulty,
      difficultyLabel:getStackTileConfig().label,
      score:finalScore,
      clearTimeMs,
      clearTimeText:formatStackTileTime(clearTimeMs),
      moveCount:stackTileState.moveCount,
      matchCount:stackTileState.matchCount,
      matchScore:stackTileState.matchScore,
      itemPenalty:stackTileState.itemPenalty,
      timeBonus:stackTileState.timeBonus,
      usedItems:{...stackTileState.usedItems},
      source:"public_stacktile",
      createdAt:firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    };

    try{
      await getStackTileRecordsRef().add(payload);

      stackTileState.message="클리어 기록이 저장되었습니다.";
      renderStackTileGame();
    }catch(err){
      console.error("겹겹타일 기록 저장 실패",err);
    }
  };
}

window.addEventListener("DOMContentLoaded",async()=>{
  syncPublicStackTileNickname();

  ["stackTileServerInput","stackTileNicknameInput"].forEach(id=>{
    document.getElementById(id)?.addEventListener("keydown",event=>{
      if(event.key==="Enter"){
        event.preventDefault();
        savePublicStackTileNickname();
      }
    });
  });

  try{
    await loadOriginalStackTileScript();
    patchPublicStackTileRecordSaving();

    if(typeof renderStackTileScreen==="function")renderStackTileScreen();
  }catch(err){
    console.error(err);
    const root=document.getElementById("stackTileRoot");
    if(root){
      root.innerHTML='<div class="stack-public-error">게임 파일을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>';
    }
  }
});
