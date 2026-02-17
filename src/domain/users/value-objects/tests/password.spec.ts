import { Password } from '../password';

describe('Password', () => {
  describe('create - valid passwords', () => {
    it('should create password with all requirements met', () => {
      const password = Password.create('SecureP@ss1');
      expect(password).toBeInstanceOf(Password);
      expect(password.getValue()).toBe('SecureP@ss1');
    });

    it('should create password with minimum length', () => {
      const password = Password.create('Passw0rd!');
      expect(password).toBeInstanceOf(Password);
    });

    it('should create password with multiple special characters', () => {
      const password = Password.create('P@ssw0rd!#$');
      expect(password).toBeInstanceOf(Password);
    });

    it('should create password with multiple uppercase letters', () => {
      const password = Password.create('PASSword1!');
      expect(password).toBeInstanceOf(Password);
    });

    it('should create password with multiple numbers', () => {
      const password = Password.create('Password123!');
      expect(password).toBeInstanceOf(Password);
    });
  });

  describe('create - minimum length validation', () => {
    it('should throw error when password is too short', () => {
      expect(() => Password.create('Pass1!')).toThrow(
        'Invalid password: Must be at least 8 characters',
      );
    });

    it('should throw error when password is empty', () => {
      expect(() => Password.create('')).toThrow(
        'Invalid password: Must be at least 8 characters',
      );
    });

    it('should throw error when password has exactly 7 characters', () => {
      expect(() => Password.create('Pass1!a')).toThrow(
        'Invalid password: Must be at least 8 characters',
      );
    });
  });

  describe('create - uppercase letter validation', () => {
    it('should throw error when password has no uppercase letters', () => {
      expect(() => Password.create('password1!')).toThrow(
        'Invalid password: Must contain at least one uppercase letter',
      );
    });

    it('should throw error when password only has lowercase and numbers', () => {
      expect(() => Password.create('password123!')).toThrow(
        'Invalid password: Must contain at least one uppercase letter',
      );
    });
  });

  describe('create - lowercase letter validation', () => {
    it('should throw error when password has no lowercase letters', () => {
      expect(() => Password.create('PASSWORD1!')).toThrow(
        'Invalid password: Must contain at least one lowercase letter',
      );
    });

    it('should throw error when password only has uppercase and numbers', () => {
      expect(() => Password.create('PASSWORD123!')).toThrow(
        'Invalid password: Must contain at least one lowercase letter',
      );
    });
  });

  describe('create - number validation', () => {
    it('should throw error when password has no numbers', () => {
      expect(() => Password.create('Password!')).toThrow(
        'Invalid password: Must contain at least one number',
      );
    });

    it('should throw error when password only has letters and special chars', () => {
      expect(() => Password.create('Password!@#')).toThrow(
        'Invalid password: Must contain at least one number',
      );
    });
  });

  describe('create - special character validation', () => {
    it('should throw error when password has no special characters', () => {
      expect(() => Password.create('Password1')).toThrow(
        'Invalid password: Must contain at least one special character',
      );
    });

    it('should throw error when password only has letters and numbers', () => {
      expect(() => Password.create('Password123')).toThrow(
        'Invalid password: Must contain at least one special character',
      );
    });

    it('should accept all defined special characters', () => {
      const specialChars = '!@#$%^&*(),.?":{}|<>';
      specialChars.split('').forEach((char) => {
        expect(() => Password.create(`Password1${char}`)).not.toThrow();
      });
    });
  });

  describe('create - multiple validation failures', () => {
    it('should throw error with all validation messages when all requirements missing', () => {
      expect(() => Password.create('pass')).toThrow(
        'Invalid password: Must be at least 8 characters, Must contain at least one uppercase letter, Must contain at least one number, Must contain at least one special character',
      );
    });

    it('should throw error with multiple messages when missing uppercase and number', () => {
      expect(() => Password.create('password!')).toThrow(
        'Invalid password: Must contain at least one uppercase letter, Must contain at least one number',
      );
    });

    it('should throw error with multiple messages when missing lowercase and special char', () => {
      expect(() => Password.create('PASSWORD1')).toThrow(
        'Invalid password: Must contain at least one lowercase letter, Must contain at least one special character',
      );
    });

    it('should throw error when only length requirement is met', () => {
      expect(() => Password.create('password')).toThrow();
      const error = () => Password.create('password');
      expect(error).toThrow('Must contain at least one uppercase letter');
      expect(error).toThrow('Must contain at least one number');
      expect(error).toThrow('Must contain at least one special character');
    });
  });

  describe('getValue', () => {
    it('should return the original password value', () => {
      const passwordValue = 'MySecureP@ss123';
      const password = Password.create(passwordValue);
      expect(password.getValue()).toBe(passwordValue);
    });
  });

  describe('edge cases', () => {
    it('should handle password with exactly 8 characters', () => {
      const password = Password.create('Passw0rd!');
      expect(password.getValue()).toBe('Passw0rd!');
    });

    it('should handle very long passwords', () => {
      const longPassword = 'P@ssw0rd' + '1'.repeat(100);
      const password = Password.create(longPassword);
      expect(password.getValue()).toBe(longPassword);
    });

    it('should handle passwords with spaces', () => {
      const password = Password.create('Pass w0rd!');
      expect(password.getValue()).toBe('Pass w0rd!');
    });

    it('should handle passwords with unicode characters', () => {
      const password = Password.create('Pässw0rd!');
      expect(password.getValue()).toBe('Pässw0rd!');
    });
  });
});
