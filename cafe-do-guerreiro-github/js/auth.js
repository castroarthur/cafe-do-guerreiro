(function () {
  const USERS_KEY = 'guerreiro_auth_users_v1';
  const SESSION_KEY = 'guerreiro_auth_session_v1';

  function safeParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  function normalizeFullName(name) {
    return String(name || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  function hasFullName(name) {
    const parts = normalizeFullName(name).split(' ').filter(Boolean);
    return parts.length >= 2 && parts.every(function (part) { return part.length >= 2; });
  }

  function hashPassword(password) {
    const source = String(password || '');
    try {
      return btoa(unescape(encodeURIComponent(source)));
    } catch (_) {
      return source;
    }
  }

  function getFirebaseConfig() {
    const config = window.GUERREIRO_FIREBASE_CONFIG;
    if (!config || config.enabled !== true) return null;
    if (!config.apiKey) return null;
    return config;
  }

  function isFirebaseMode() {
    return !!getFirebaseConfig();
  }

  function getUsersMap() {
    return safeParse(localStorage.getItem(USERS_KEY), {});
  }

  function saveUsersMap(map) {
    localStorage.setItem(USERS_KEY, JSON.stringify(map));
  }

  function getSession() {
    return safeParse(localStorage.getItem(SESSION_KEY), null);
  }

  function dispatchAuthEvents() {
    window.dispatchEvent(new Event('guerreiro-auth-changed'));
    window.dispatchEvent(new Event('guerreiro-data-scope-changed'));
  }

  function setSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    dispatchAuthEvents();
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    dispatchAuthEvents();
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session || !session.email) return null;

    if (session.provider === 'firebase') {
      return {
        nome: session.nome || session.email.split('@')[0],
        email: session.email,
        provider: 'firebase',
        criadoEm: session.criadoEm || null
      };
    }

    const users = getUsersMap();
    const user = users[session.email];
    if (!user) {
      return {
        nome: session.nome || session.email.split('@')[0],
        email: session.email,
        provider: 'local',
        criadoEm: session.criadoEm || null
      };
    }

    return {
      nome: user.nome,
      email: user.email,
      provider: 'local',
      criadoEm: user.criadoEm || null
    };
  }

  function getStorageScope() {
    const user = getCurrentUser();
    const raw = user?.email ? normalizeEmail(user.email) : 'guest';
    return raw.replace(/[^a-z0-9]/g, '_');
  }

  async function firebaseRequest(endpoint, payload) {
    const config = getFirebaseConfig();
    if (!config) {
      return { ok: false, message: 'Firebase nao configurado neste ambiente.' };
    }

    try {
      const response = await fetch(endpoint + '?key=' + encodeURIComponent(config.apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        const code = data?.error?.message || 'UNKNOWN';
        const messages = {
          EMAIL_EXISTS: 'Ja existe uma conta com este e-mail.',
          EMAIL_NOT_FOUND: 'Conta nao encontrada.',
          INVALID_PASSWORD: 'Senha incorreta.',
          TOO_MANY_ATTEMPTS_TRY_LATER: 'Muitas tentativas. Tente novamente mais tarde.',
          USER_DISABLED: 'Conta desativada.',
          INVALID_EMAIL: 'Email invalido.'
        };
        return { ok: false, message: messages[code] || 'Nao foi possivel autenticar agora.' };
      }

      return { ok: true, data };
    } catch (_) {
      return { ok: false, message: 'Falha de conexao com servico de autenticacao.' };
    }
  }

  function registerLocal(input) {
    const nome = normalizeFullName(input?.nome);
    const email = normalizeEmail(input?.email);
    const senha = String(input?.senha || '');

    if (!hasFullName(nome)) {
      return { ok: false, message: 'Informe seu nome completo (nome e sobrenome).' };
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return { ok: false, message: 'Digite um email valido.' };
    }

    if (senha.length < 6) {
      return { ok: false, message: 'A senha deve ter no minimo 6 caracteres.' };
    }

    const users = getUsersMap();
    if (users[email]) {
      return { ok: false, message: 'Ja existe uma conta com este e-mail.' };
    }

    const criadoEm = new Date().toISOString();
    users[email] = {
      nome,
      email,
      senhaHash: hashPassword(senha),
      criadoEm
    };

    saveUsersMap(users);
    setSession({ email, nome, criadoEm, loginEm: new Date().toISOString(), provider: 'local' });

    return {
      ok: true,
      message: 'Conta criada com sucesso.',
      user: { nome, email, provider: 'local' }
    };
  }

  function loginLocal(input) {
    const email = normalizeEmail(input?.email);
    const senha = String(input?.senha || '');

    if (!email || !senha) {
      return { ok: false, message: 'Informe email e senha.' };
    }

    const users = getUsersMap();
    const user = users[email];
    if (!user) {
      return { ok: false, message: 'Conta nao encontrada.' };
    }

    if (user.senhaHash !== hashPassword(senha)) {
      return { ok: false, message: 'Senha incorreta.' };
    }

    setSession({ email, nome: user.nome, criadoEm: user.criadoEm || null, loginEm: new Date().toISOString(), provider: 'local' });

    return {
      ok: true,
      message: 'Login realizado com sucesso.',
      user: { nome: user.nome, email: user.email, provider: 'local' }
    };
  }

  function resetPasswordLocal(input) {
    const email = normalizeEmail(input?.email);
    const novaSenha = String(input?.novaSenha || '');

    if (!email) return { ok: false, message: 'Informe o email da conta.' };
    if (novaSenha.length < 6) return { ok: false, message: 'A nova senha deve ter no minimo 6 caracteres.' };

    const users = getUsersMap();
    const user = users[email];
    if (!user) {
      return { ok: false, message: 'Conta nao encontrada para este email.' };
    }

    user.senhaHash = hashPassword(novaSenha);
    saveUsersMap(users);
    return { ok: true, message: 'Senha atualizada com sucesso.' };
  }

  async function registerFirebase(input) {
    const nome = normalizeFullName(input?.nome);
    const email = normalizeEmail(input?.email);
    const senha = String(input?.senha || '');

    if (!hasFullName(nome)) {
      return { ok: false, message: 'Informe seu nome completo (nome e sobrenome).' };
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return { ok: false, message: 'Digite um email valido.' };
    }

    if (senha.length < 6) {
      return { ok: false, message: 'A senha deve ter no minimo 6 caracteres.' };
    }

    const signup = await firebaseRequest('https://identitytoolkit.googleapis.com/v1/accounts:signUp', {
      email,
      password: senha,
      returnSecureToken: true
    });

    if (!signup.ok) return signup;

    const profile = await firebaseRequest('https://identitytoolkit.googleapis.com/v1/accounts:update', {
      idToken: signup.data.idToken,
      displayName: nome,
      returnSecureToken: true
    });

    const verifyEmail = await firebaseRequest('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode', {
      requestType: 'VERIFY_EMAIL',
      idToken: signup.data.idToken
    });

    return {
      ok: true,
      message: verifyEmail.ok
        ? 'Conta criada com sucesso. Enviamos um e-mail para verificar sua conta.'
        : (profile.ok ? 'Conta criada com Firebase com sucesso. Verifique seu e-mail para entrar.' : 'Conta criada com sucesso. Verifique seu e-mail para entrar.'),
      requiresEmailVerification: true,
      user: { nome, email, provider: 'firebase' }
    };
  }

  async function loginFirebase(input) {
    const email = normalizeEmail(input?.email);
    const senha = String(input?.senha || '');

    if (!email || !senha) {
      return { ok: false, message: 'Informe email e senha.' };
    }

    const loginResult = await firebaseRequest('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', {
      email,
      password: senha,
      returnSecureToken: true
    });

    if (!loginResult.ok) return loginResult;

    const accountLookup = await firebaseRequest('https://identitytoolkit.googleapis.com/v1/accounts:lookup', {
      idToken: loginResult.data.idToken
    });

    if (!accountLookup.ok) {
      return { ok: false, message: 'Nao foi possivel validar seu e-mail agora. Tente novamente.' };
    }

    const firebaseUser = accountLookup.data?.users?.[0];
    if (firebaseUser?.emailVerified === false) {
      const resend = await firebaseRequest('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode', {
        requestType: 'VERIFY_EMAIL',
        idToken: loginResult.data.idToken
      });

      return {
        ok: false,
        message: resend.ok
          ? 'Seu e-mail ainda nao foi verificado. Enviamos um novo link de verificacao.'
          : 'Seu e-mail ainda nao foi verificado. Verifique sua caixa de entrada para liberar o login.'
      };
    }

    const nome = loginResult.data.displayName || email.split('@')[0];
    setSession({ email, nome, criadoEm: null, loginEm: new Date().toISOString(), provider: 'firebase' });

    return {
      ok: true,
      message: 'Login realizado com Firebase com sucesso.',
      user: { nome, email, provider: 'firebase' }
    };
  }

  async function resetPasswordFirebase(input) {
    const email = normalizeEmail(input?.email);
    if (!email) return { ok: false, message: 'Informe o email da conta.' };

    const response = await firebaseRequest('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode', {
      requestType: 'PASSWORD_RESET',
      email
    });

    if (!response.ok) return response;
    return { ok: true, message: 'Email de recuperacao enviado. Verifique sua caixa de entrada.' };
  }

  async function register(input) {
    return isFirebaseMode() ? registerFirebase(input) : registerLocal(input);
  }

  async function login(input) {
    return isFirebaseMode() ? loginFirebase(input) : loginLocal(input);
  }

  async function requestPasswordReset(input) {
    return isFirebaseMode() ? resetPasswordFirebase(input) : resetPasswordLocal(input);
  }

  function logout() {
    clearSession();
    return { ok: true };
  }

  function showMessage(message) {
    if (!message) return;
    if (window.GuerreiroUI?.showToast) {
      window.GuerreiroUI.showToast(message);
      return;
    }
    console.log(message);
  }

  function ensureAuthContainer(navActions) {
    let container = navActions.querySelector('#authActions');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'authActions';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '.45rem';
    navActions.appendChild(container);
    return container;
  }

  function getSafeNextFromPage() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    if (current === 'login.html') return 'index.html';
    return current;
  }

  function getAuthModeFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const mode = String(params.get('mode') || '').toLowerCase();
    if (mode === 'register' || mode === 'signup' || mode === 'cadastro') return 'register';
    return 'login';
  }

  function refreshDataViews() {
    window.GuerreiroCart?.updateCartCount?.();
    window.GuerreiroMenu?.updateFavoritesCount?.();
  }

  function renderNavAuth() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const user = getCurrentUser();
    const themeToggle = document.getElementById('themeToggle');
    const container = ensureAuthContainer(navActions);
    container.innerHTML = '';

    if (!user) {
      if (themeToggle) themeToggle.style.display = 'inline-flex';
      const next = encodeURIComponent(getSafeNextFromPage());

      const loginLink = document.createElement('a');
      loginLink.href = 'login.html?next=' + next;
      loginLink.className = 'btn-text';
      loginLink.setAttribute('aria-label', 'Entrar na conta');
      loginLink.textContent = 'Entrar';

      const signUpLink = document.createElement('a');
      signUpLink.href = 'login.html?mode=register&next=' + next;
      signUpLink.className = 'btn-text';
      signUpLink.setAttribute('aria-label', 'Criar conta');
      signUpLink.textContent = 'Criar conta';

      container.appendChild(loginLink);
      container.appendChild(signUpLink);
      return;
    }

    if (themeToggle) themeToggle.style.display = 'none';

    const accountLink = document.createElement('a');
    accountLink.href = 'minha-conta.html';
    accountLink.className = 'btn-text';
    accountLink.setAttribute('aria-label', 'Abrir minha conta');
    accountLink.textContent = 'Minha conta';

    const name = document.createElement('span');
    name.className = 'auth-user';
    name.style.fontSize = '.9rem';
    name.style.fontWeight = '700';
    name.textContent = user.nome.split(' ')[0];

    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'btn-text';
    logoutBtn.setAttribute('aria-label', 'Sair da conta');
    logoutBtn.textContent = 'Sair';
    logoutBtn.addEventListener('click', function () {
      logout();
      showMessage('Voce saiu da conta.');
      refreshDataViews();
      renderNavAuth();
    });

    container.appendChild(accountLink);
    container.appendChild(name);
    container.appendChild(logoutBtn);
  }

  function getNextUrl() {
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || 'index.html';
    if (/^https?:\/\//i.test(next)) return 'index.html';
    return next;
  }

  function initAuthPage() {
    const page = document.body?.dataset?.page;
    if (page !== 'auth') return;

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotForm = document.getElementById('forgotForm');
    const loginTab = document.getElementById('tabLogin');
    const registerTab = document.getElementById('tabRegister');
    const forgotToggle = document.getElementById('forgotPasswordBtn');
    const modeInfo = document.getElementById('authModeInfo');
    const forgotModeHint = document.getElementById('forgotModeHint');
    const forgotLocalFields = document.getElementById('forgotLocalFields');
    const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');
    const usingFirebase = isFirebaseMode();

    if (!loginForm || !registerForm || !forgotForm || !loginTab || !registerTab || !forgotToggle) return;

    const registerNameInput = document.getElementById('registerNome');
    registerNameInput?.addEventListener('input', function (event) {
      const el = event.target;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const upperValue = String(el.value || '').toUpperCase();
      if (el.value !== upperValue) {
        el.value = upperValue;
        if (typeof start === 'number' && typeof end === 'number') {
          el.setSelectionRange(start, end);
        }
      }
    });

    if (modeInfo) {
      modeInfo.textContent = usingFirebase
        ? 'Modo atual: Firebase Auth (nuvem).'
        : 'Modo atual: Local (navegador).';
    }

    if (forgotModeHint) {
      forgotModeHint.textContent = usingFirebase
        ? 'No modo Firebase, enviaremos um link de recuperacao para seu e-mail.'
        : 'No modo local, defina a nova senha agora.';
    }

    if (forgotLocalFields) {
      forgotLocalFields.hidden = usingFirebase;
    }

    if (forgotSubmitBtn) {
      forgotSubmitBtn.textContent = usingFirebase ? 'Enviar link de recuperacao' : 'Recuperar senha';
    }

    function applyAuthTabTheme() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
        || document.body.classList.contains('dark-mode');

      const paint = function (tabEl, isActive) {
        if (!tabEl) return;

        if (!isDark) {
          tabEl.style.background = '';
          tabEl.style.color = '';
          tabEl.style.borderColor = '';
          tabEl.style.webkitTextFillColor = '';
          return;
        }

        if (isActive) {
          tabEl.style.background = '#f0dbc6';
          tabEl.style.color = '#2f1f14';
          tabEl.style.borderColor = '#f0dbc6';
          tabEl.style.webkitTextFillColor = '#2f1f14';
        } else {
          tabEl.style.background = '#2b2723';
          tabEl.style.color = '#f5e6d6';
          tabEl.style.borderColor = '#54463b';
          tabEl.style.webkitTextFillColor = '#f5e6d6';
        }
      };

      paint(loginTab, loginTab.classList.contains('active'));
      paint(registerTab, registerTab.classList.contains('active'));
    }

    function activate(tab) {
      const isLogin = tab === 'login';
      const isRegister = tab === 'register';
      const isForgot = tab === 'forgot';

      loginTab.classList.toggle('active', isLogin);
      registerTab.classList.toggle('active', isRegister);
      loginTab.setAttribute('aria-selected', String(isLogin));
      registerTab.setAttribute('aria-selected', String(isRegister));

      loginForm.hidden = !isLogin;
      registerForm.hidden = !isRegister;
      forgotForm.hidden = !isForgot;
      forgotToggle.textContent = isForgot ? 'Voltar para login' : 'Esqueci minha senha';
      applyAuthTabTheme();
    }

    loginTab.addEventListener('click', function () { activate('login'); });
    registerTab.addEventListener('click', function () { activate('register'); });
    forgotToggle.addEventListener('click', function () {
      const showingForgot = forgotForm.hidden === false;
      activate(showingForgot ? 'login' : 'forgot');
    });

    const themeToggle = document.getElementById('themeToggle');
    themeToggle?.addEventListener('click', function () {
      requestAnimationFrame(applyAuthTabTheme);
    });

    loginForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const result = await login({
        email: document.getElementById('loginEmail')?.value,
        senha: document.getElementById('loginSenha')?.value
      });

      showMessage(result.message);
      if (!result.ok) return;

      refreshDataViews();
      window.location.href = getNextUrl();
    });

    registerForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const senha = String(document.getElementById('registerSenha')?.value || '');
      const confirmarSenha = String(document.getElementById('registerConfirmarSenha')?.value || '');

      if (senha !== confirmarSenha) {
        showMessage('As senhas nao conferem.');
        return;
      }

      const result = await register({
        nome: normalizeFullName(document.getElementById('registerNome')?.value),
        email: document.getElementById('registerEmail')?.value,
        senha
      });

      showMessage(result.message);
      if (!result.ok) return;

      if (result.requiresEmailVerification) {
        registerForm.reset();
        activate('login');
        return;
      }

      refreshDataViews();
      window.location.href = getNextUrl();
    });

    forgotForm.addEventListener('submit', async function (event) {
      event.preventDefault();

      const email = document.getElementById('forgotEmail')?.value || '';
      const novaSenha = document.getElementById('forgotNovaSenha')?.value || '';
      const confirmar = document.getElementById('forgotConfirmarSenha')?.value || '';

      if (!usingFirebase) {
        if (String(novaSenha).length < 6) {
          showMessage('A nova senha deve ter no minimo 6 caracteres.');
          return;
        }
        if (String(novaSenha) !== String(confirmar)) {
          showMessage('As senhas da recuperacao nao conferem.');
          return;
        }
      }

      const result = await requestPasswordReset({ email, novaSenha });
      showMessage(result.message);
      if (result.ok) activate('login');
    });

    const user = getCurrentUser();
    if (user) {
      const alreadyLogged = document.getElementById('alreadyLogged');
      if (alreadyLogged) {
        alreadyLogged.hidden = false;
        alreadyLogged.innerHTML = 'Voce ja esta logado como ' + user.email + '. <a href="minha-conta.html">Abrir minha conta</a>';
      }
    }

    activate(getAuthModeFromQuery());
    applyAuthTabTheme();
  }

  function initAccountPage() {
    const page = document.body?.dataset?.page;
    if (page !== 'account') return;

    const user = getCurrentUser();
    const nameEl = document.getElementById('accountName');
    const emailEl = document.getElementById('accountEmail');
    const providerEl = document.getElementById('accountProvider');
    const createdEl = document.getElementById('accountCreatedAt');
    const favoritesEl = document.getElementById('accountFavoritesCount');
    const cartEl = document.getElementById('accountCartCount');
    const ordersEl = document.getElementById('accountOrdersCount');
    const logoutBtn = document.getElementById('accountLogoutBtn');

    if (nameEl) nameEl.textContent = user?.nome || '-';
    if (emailEl) emailEl.textContent = user?.email || '-';
    if (providerEl) providerEl.textContent = user?.provider === 'firebase' ? 'Firebase Auth' : 'Local';

    const createdAt = user?.criadoEm ? new Date(user.criadoEm) : null;
    if (createdEl) createdEl.textContent = createdAt && !Number.isNaN(createdAt.getTime())
      ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(createdAt)
      : 'Nao disponivel';

    const favCount = window.GuerreiroMenu?.getFavorites?.()?.length || 0;
    const cartCount = (window.GuerreiroCart?.getCart?.() || []).reduce((sum, item) => sum + (item.qty || 0), 0);
    const orderCount = window.GuerreiroCart?.getOrderHistory?.()?.length || 0;

    if (favoritesEl) favoritesEl.textContent = String(favCount);
    if (cartEl) cartEl.textContent = String(cartCount);
    if (ordersEl) ordersEl.textContent = String(orderCount);

    logoutBtn?.addEventListener('click', function () {
      logout();
      showMessage('Sessao encerrada com sucesso.');
      window.location.href = 'index.html';
    });
  }

  function initAuthGuard() {
    const requiresAuth = document.body?.dataset?.authRequired === 'true';
    if (!requiresAuth) return true;

    const user = getCurrentUser();
    if (user) return true;

    const current = window.location.pathname.split('/').pop() || 'index.html';
    window.location.href = 'login.html?next=' + encodeURIComponent(current);
    return false;
  }

  function init() {
    if (!initAuthGuard()) return;

    renderNavAuth();
    initAuthPage();
    initAccountPage();

    window.addEventListener('guerreiro-auth-changed', function () {
      renderNavAuth();
      refreshDataViews();
    });

    window.addEventListener('storage', function (event) {
      if (event.key === USERS_KEY || event.key === SESSION_KEY) {
        renderNavAuth();
        refreshDataViews();
      }
    });
  }

  window.GuerreiroAuth = {
    register,
    login,
    requestPasswordReset,
    logout,
    getCurrentUser,
    getStorageScope,
    isFirebaseMode,
    renderNavAuth
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
