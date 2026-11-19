export const passwordHint = 'Use at least 8 characters (up to 72 bytes).';
export const phoneHint = 'Use a 10-digit Indian mobile number or include an international country code.';

export function passwordError(password) {
  return Array.from(password).length < 8 || !password.trim() || new TextEncoder().encode(password).length > 72
    ? passwordHint
    : '';
}

export function registrationError({ email, phone, password, confirmPassword }) {
  const [local, domain, extra] = email.trim().split('@');
  if (!local || !domain || extra !== undefined || email.trim().length > 150 ||
      local.length > 64 || !/^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/i.test(local) ||
      local.startsWith('.') || local.endsWith('.') || local.includes('..') ||
      !domain.includes('.') ||
      !domain.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)) ||
      !/^[a-z]{2,63}$/i.test(domain.split('.').at(-1))) {
    return 'Enter a valid email address, like name@example.com.';
  }

  const formattedPhone = phone.trim();
  const compactPhone = formattedPhone.replace(/[ ().-]/g, '');
  const international = compactPhone.startsWith('+91')
    ? /^\+91[1-9]\d{9}$/.test(compactPhone)
    : /^\+[1-9]\d{7,14}$/.test(compactPhone);
  if (formattedPhone.length > 32 || !/^\+?[0-9 ().-]+$/.test(formattedPhone) ||
      (!/^[6-9]\d{9}$/.test(compactPhone) && !international)) {
    return phoneHint;
  }

  return passwordError(password) || (password !== confirmPassword ? 'Passwords do not match.' : '');
}
