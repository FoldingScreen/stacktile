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

let stackTileInfoModalMode="manual";
let stackTileInfoModalResolve=null;
let stackTileClearPromptAnswered=false;
let stackTilePrivateRankingMode=false;

function hasPublicStackTileInfo(){
  return !!(String(state.serverNumber||"").trim()&&String(state.nickname||"").trim());
}

function getPublicStackTilePlayerLabel(){
  const server=String(state.serverNumber||"").trim();
  const nickname=String(state.nickname||"").trim();

  if(server&&nickname)return `[${server}]${nickname}`;
  return "";
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
  const status=document.getElementById("stackTileInfoStatus");
  const help=document.getElementById("stackTileNicknameHelp");
  const openBtn=document.getElementById("stackTileInfoOpenBtn");
  const clearBtn=document.getElementById("stackTileNicknameClearBtn");
  const label=state.currentUser||"";

  if(serverInput)serverInput.value=state.serverNumber||"";
  if(nicknameInput)nicknameInput.value=state.nickname||"";

  if(status){
    if(label){
      status.innerHTML=`<div class="public-info-line"><span>랭킹명</span><strong>${escapeHtml(label)}</strong></div>`;
    }else if(stackTilePrivateRankingMode){
      status.innerHTML=`<div class="public-info-line"><span>랭킹명</span><strong>비공개</strong></div>`;
    }else{
      status.textContent="저장된 정보가 없습니다. 첫 클리어 시 랭킹 등록 여부를 묻습니다.";
    }
  }

  if(help){
    help.textContent=stackTileInfoModalMode==="clear"
      ? "예를 선택하면 입력한 정보로 등록되고, 아니오를 선택하면 비공개로 등록됩니다."
      : "저장된 정보는 이 브라우저에만 보관됩니다.";
  }

  if(openBtn)openBtn.textContent=label?"정보 변경":"정보 저장";
  if(clearBtn)clearBtn.classList.toggle("hidden",!label);
}

function openPublicStackTileInfoModal(mode="manual"){
  stackTileInfoModalMode=mode;
  syncPublicStackTileNickname();

  const overlay=document.getElementById("stackTileInfoOverlay");
  const modal=document.getElementById("stackTileInfoModal");
  const title=document.getElementById("stackTileInfoModalTitle");
  const desc=document.getElementById("stackTileInfoModalDesc");
  const closeBtn=document.getElementById("stackTileInfoCloseBtn");
  const privateBtn=document.getElementById("stackTileInfoPrivateBtn");
  const saveBtn=document.getElementById("stackTileInfoSaveBtn");

  if(title)title.textContent=mode==="clear"?"랭킹 등록":"랭킹 정보 저장";
  if(desc){
    desc.textContent=mode==="clear"
      ? "클리어했습니다! 랭킹 등록을 위해 서버 숫자와 닉네임을 저장할까요?"
      : "서버 숫자와 닉네임을 저장하면 클리어 기록이 랭킹에 등록됩니다.";
  }
  if(closeBtn)closeBtn.classList.toggle("hidden",mode==="clear");
  if(privateBtn)privateBtn.classList.toggle("hidden",mode!=="clear");
  if(saveBtn)saveBtn.textContent=mode==="clear"?"예, 정보 저장 후 등록":"정보 저장";

  overlay?.classList.remove("hidden");
  modal?.classList.remove("hidden");

  setTimeout(()=>{
    const firstEmpty=String(document.getElementById("stackTileServerInput")?.value||"").trim()
      ? document.getElementById("stackTileNicknameInput")
      : document.getElementById("stackTileServerInput");
    firstEmpty?.focus();
  },0);

  if(mode==="clear"){
    return new Promise(resolve=>{
      stackTileInfoModalResolve=resolve;
    });
  }

  return Promise.resolve("manual");
}

function closePublicStackTileInfoModal(result="closed"){
  if(stackTileInfoModalMode==="clear"&&result==="closed")return;

  document.getElementById("stackTileInfoOverlay")?.classList.add("hidden");
  document.getElementById("stackTileInfoModal")?.classList.add("hidden");

  const resolve=stackTileInfoModalResolve;
  stackTileInfoModalResolve=null;
  stackTileInfoModalMode="manual";

  if(resolve)resolve(result);

  syncPublicStackTileNickname();
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
  stackTilePrivateRankingMode=false;
  updatePublicStackTileCurrentUser();

  localStorage.setItem("stackTilePublicServerNumber",serverNumber);
  localStorage.setItem("stackTilePublicNickname",nickname);

  const result=stackTileInfoModalMode==="clear"?"saved":"manual-saved";
  closePublicStackTileInfoModal(result);

  if(typeof subscribeStackTileRecords==="function")subscribeStackTileRecords();
  if(typeof renderStackTileGame==="function")renderStackTileGame();
}

function submitPublicStackTilePrivateChoice(){
  stackTilePrivateRankingMode=true;
  stackTileClearPromptAnswered=true;
  closePublicStackTileInfoModal("private");
}

function clearPublicStackTileNickname(){
  state.serverNumber="";
  state.nickname="";
  state.currentUser="";
  stackTilePrivateRankingMode=false;
  stackTileClearPromptAnswered=false;

  localStorage.removeItem("stackTilePublicServerNumber");
  localStorage.removeItem("stackTilePublicNickname");

  syncPublicStackTileNickname();

  if(typeof renderStackTileGame==="function")renderStackTileGame();
}

async function ensurePublicStackTileRankingChoiceForClear(){
  updatePublicStackTileCurrentUser();

  if(hasPublicStackTileInfo())return "saved";
  if(stackTilePrivateRankingMode)return "private";

  if(stackTileClearPromptAnswered){
    stackTilePrivateRankingMode=true;
    return "private";
  }

  stackTileClearPromptAnswered=true;
  const result=await openPublicStackTileInfoModal("clear");

  if(result==="saved"&&hasPublicStackTileInfo())return "saved";

  stackTilePrivateRankingMode=true;
  return "private";
}

window.openPublicStackTileInfoModal=openPublicStackTileInfoModal;
window.closePublicStackTileInfoModal=closePublicStackTileInfoModal;
window.savePublicStackTileNickname=savePublicStackTileNickname;
window.submitPublicStackTilePrivateChoice=submitPublicStackTilePrivateChoice;
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

    const choice=await ensurePublicStackTileRankingChoiceForClear();
    const isPrivate=choice!=="saved";

    stackTileState.clearSaved=true;

    const finalScore=calculateStackTileScore();
    const clearTimeMs=getStackTileElapsedMs();
    const rawNickname=isPrivate?"":String(state.nickname||"").trim();
    const serverNumber=isPrivate?"":String(state.serverNumber||"").trim();
    const playerLabel=isPrivate?"비공개":getPublicStackTilePlayerLabel();

    const payload={
      nickname:playerLabel,
      rawNickname,
      serverNumber,
      isPrivate,
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

      stackTileState.message=isPrivate
        ? "비공개로 클리어 기록이 저장되었습니다."
        : "클리어 기록이 저장되었습니다.";
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

  document.getElementById("stackTileInfoOverlay")?.addEventListener("click",()=>{
    closePublicStackTileInfoModal();
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
