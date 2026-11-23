/* PRO welcome screen page module. */
(()=> {
 'use strict';
 window.renderPrincipiaWelcomeScreen=function({account={},name='bạn',logo='/assets/images/principia-logo-round.svg'}={}){
  const safeName=String(name||'bạn').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeEmail=String(account.email||'Tài khoản đã đăng nhập').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const character=typeof window.principiaWelcomeCharacterMarkup==='function'?window.principiaWelcomeCharacterMarkup():'<img class="pw-welcome-character" src="/assets/images/principia-chat-character.png" alt="Nhân vật PRO">';
  return `<main class="principia-welcome-screen">
   <div class="pw-glow pw-glow-one"></div><div class="pw-glow pw-glow-two"></div><div class="pw-stars"></div>
   <header class="pw-header">
    <div class="pw-brand"><img src="${logo}" alt="PRO"><span><b>PRO</b><small>PRINCIPIA PHYSICS OLYMPIAD</small></span></div>
    <div class="pw-account"><span class="pw-online-dot"></span><span>${safeEmail}</span></div>
   </header>
   <section class="pw-content pw-welcome-layout">
    <div class="pw-copy">
     <div class="pw-kicker"><span></span> YOUR NEXT CHAPTER STARTS HERE</div>
     <div class="pw-overline">WELCOME TO</div><h1>PRO</h1>
     <h2>Chào mừng <em>${safeName}</em><br>đến với PRO!</h2>
     <p>Một không gian học tập được tạo ra để bạn khám phá Vật lý, chinh phục thử thách và tiến bộ theo cách của riêng mình.</p>
     <button class="pw-start-button" type="button" onclick="startPrincipiaJourney()">Bắt đầu hành trình <span aria-hidden="true">→</span></button>
     <div class="pw-note"><span class="pw-note-line"></span> HỌC TẬP · KHÁM PHÁ · BỨT PHÁ</div>
    </div>
    <div class="pw-visual" aria-label="Không gian khám phá Vật lý">
     <div class="pw-orbit pw-orbit-a"></div><div class="pw-orbit pw-orbit-b"></div>
     <div class="pw-art-panel">
      <div class="pw-art-top"><span>PHYSICS EXPLORER</span><i>● READY TO BEGIN</i></div>
      <div class="pw-character-halo">${character}</div>
      <div class="pw-speech"><span class="pw-speech-dot"></span><b>Tri thức bắt đầu từ sự tò mò.</b><small>Hãy bắt đầu hành trình của bạn hôm nay.</small></div>
      <div class="pw-formula-row"><span>F = ma</span><span>E = mc²</span><span>v = λf</span></div>
      <div class="pw-art-bottom"><span>LEARN</span><span>DISCOVER</span><span>ACHIEVE</span></div>
     </div>
     <div class="pw-floating-chip pw-chip-top">01 · EXPLORE</div><div class="pw-floating-chip pw-chip-bottom">02 · DISCOVER</div>
    </div>
   </section>
   <footer class="pw-footer"><span>PRO · PRINCIPIA PHYSICS OLYMPIAD</span><span>MADE FOR CURIOUS MINDS</span></footer>
  </main>`;
 };
})();
