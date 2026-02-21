export const validateName = (name: string): boolean => {
  const namePattern = /^[a-zA-Z0-9\s]+$/;

  return namePattern.test(name) && name.trim().length > 0;
};
export const validateEmail = (email: string): boolean => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailPattern.test(email);
};
