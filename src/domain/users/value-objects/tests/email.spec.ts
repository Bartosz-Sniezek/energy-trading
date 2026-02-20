import { Email } from '../email';
import { InvalidEmailAddressError } from '../../errors/invalid-email-address.error';

describe('Email', () => {
  describe('create', () => {
    describe('when email is valid', () => {
      it('should create an Email instance with a simple email', () => {
        const email = Email.create('test@example.com');

        expect(email).toBeInstanceOf(Email);
        expect(email.getValue()).toBe('test@example.com');
      });

      it('should create an Email instance with subdomain', () => {
        const email = Email.create('user@mail.example.com');

        expect(email).toBeInstanceOf(Email);
        expect(email.getValue()).toBe('user@mail.example.com');
      });

      it('should create an Email instance with plus addressing', () => {
        const email = Email.create('user+tag@example.com');

        expect(email).toBeInstanceOf(Email);
        expect(email.getValue()).toBe('user+tag@example.com');
      });

      it('should create an Email instance with numbers', () => {
        const email = Email.create('user123@example456.com');

        expect(email).toBeInstanceOf(Email);
        expect(email.getValue()).toBe('user123@example456.com');
      });

      it('should create an Email instance with dots in local part', () => {
        const email = Email.create('first.last@example.com');

        expect(email).toBeInstanceOf(Email);
        expect(email.getValue()).toBe('first.last@example.com');
      });

      it('should create an Email instance with hyphens in domain', () => {
        const email = Email.create('user@my-domain.com');

        expect(email).toBeInstanceOf(Email);
        expect(email.getValue()).toBe('user@my-domain.com');
      });
    });

    describe('when email is invalid', () => {
      it('should throw InvalidEmailAddressError for empty string', () => {
        expect(() => Email.create('')).toThrow(InvalidEmailAddressError);
        expect(() => Email.create('')).toThrow('Invalid email address');
      });

      it('should throw InvalidEmailAddressError for missing @ symbol', () => {
        expect(() => Email.create('userexample.com')).toThrow(
          InvalidEmailAddressError,
        );
      });

      it('should throw InvalidEmailAddressError for missing domain', () => {
        expect(() => Email.create('user@')).toThrow(InvalidEmailAddressError);
      });

      it('should throw InvalidEmailAddressError for missing local part', () => {
        expect(() => Email.create('@example.com')).toThrow(
          InvalidEmailAddressError,
        );
      });

      it('should throw InvalidEmailAddressError for multiple @ symbols', () => {
        expect(() => Email.create('user@@example.com')).toThrow(
          InvalidEmailAddressError,
        );
      });

      it('should throw InvalidEmailAddressError for spaces', () => {
        expect(() => Email.create('user @example.com')).toThrow(
          InvalidEmailAddressError,
        );
        expect(() => Email.create('user@ example.com')).toThrow(
          InvalidEmailAddressError,
        );
      });

      it('should throw InvalidEmailAddressError for missing TLD', () => {
        expect(() => Email.create('user@example')).toThrow(
          InvalidEmailAddressError,
        );
      });

      it('should throw InvalidEmailAddressError for null', () => {
        expect(() => Email.create(null as any)).toThrow(
          InvalidEmailAddressError,
        );
      });

      it('should throw InvalidEmailAddressError for undefined', () => {
        expect(() => Email.create(undefined as any)).toThrow(
          InvalidEmailAddressError,
        );
      });
    });
  });

  describe('getValue', () => {
    it('should return the email value', () => {
      const emailValue = 'test@example.com';
      const email = Email.create(emailValue);

      expect(email.getValue()).toBe(emailValue);
    });

    it('should return the exact value provided during creation', () => {
      const emailValue = 'CaseSensitive@Example.COM';
      const email = Email.create(emailValue);

      expect(email.getValue()).toBe(emailValue);
    });
  });

  describe('immutability', () => {
    it('should create different instances for different emails', () => {
      const email1 = Email.create('user1@example.com');
      const email2 = Email.create('user2@example.com');

      expect(email1).not.toBe(email2);
      expect(email1.getValue()).not.toBe(email2.getValue());
    });

    it('should create different instances even for the same email value', () => {
      const email1 = Email.create('same@example.com');
      const email2 = Email.create('same@example.com');

      expect(email1).not.toBe(email2);
      expect(email1.getValue()).toBe(email2.getValue());
    });
  });
});
