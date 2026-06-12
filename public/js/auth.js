async function initClerk() {
  if (!window.Clerk) return;
  await window.Clerk.load();

  var signInEl = document.getElementById('clerk-sign-in');
  var signUpEl = document.getElementById('clerk-sign-up');

  if (signInEl) {
    window.Clerk.mountSignIn(signInEl, {
      signUpUrl: '/sign-up',
      afterSignInUrl: '/account',
      appearance: {
        variables: {
          colorPrimary: '#000000',
          colorTextOnPrimaryBackground: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          borderRadius: '8px'
        }
      }
    });
  }

  if (signUpEl) {
    window.Clerk.mountSignUp(signUpEl, {
      signInUrl: '/sign-in',
      afterSignUpUrl: '/account',
      appearance: {
        variables: {
          colorPrimary: '#000000',
          colorTextOnPrimaryBackground: '#ffffff',
          fontFamily: 'Inter, sans-serif',
          borderRadius: '8px'
        }
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initClerk);
} else {
  initClerk();
}
