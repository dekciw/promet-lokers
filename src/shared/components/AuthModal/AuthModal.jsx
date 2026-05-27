import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { validateInviteCode } from '../../hooks/useInviteCode';
import styles from './AuthModal.module.css';

const INVITE_CODE_KEY = 'promet_invite_code';

function CloseSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="1" y1="1" x2="13" y2="13" />
      <line x1="13" y1="1" x2="1" y2="13" />
    </svg>
  );
}

function CardHeader({ title, subtitle }) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );
}

function LoginForm({ onSwitch, onSuccess, onClose }) {
  const [shake, setShake] = useState(false);
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting } } = useForm();

  async function onSubmit({ email, password }) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await getDoc(doc(db, 'users', cred.user.uid));
      if (snap.exists() && snap.data().status === 'disabled') {
        await signOut(auth);
        setError('root', { message: 'Аккаунт деактивирован. Обратитесь к администратору.' });
        setShake(true);
        setTimeout(() => setShake(false), 400);
        return;
      }
      onSuccess?.();
    } catch {
      setError('root', { message: 'Неверный email или пароль' });
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  return (
    <div className={`${styles.card}${shake ? ` ${styles.cardShake}` : ''}`}>
      <button className={styles.closeBtn} type="button" onClick={onClose} aria-label="Закрыть">
        <CloseSvg />
      </button>
      <div className={styles.logo}>
        <img src="/img/brand/logo.svg" alt="Промет" className={styles.logoImg} />
      </div>
      <CardHeader title="Вход в систему" subtitle="Конфигуратор шкафов-локеров" />
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            autoFocus
            disabled={isSubmitting}
            className={`${styles.input}${errors.root ? ` ${styles.inputError}` : ''}`}
            {...register('email', { required: true, onChange: () => clearErrors('root') })}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="auth-password">Пароль</label>
          <input
            id="auth-password"
            type="password"
            autoComplete="current-password"
            disabled={isSubmitting}
            className={`${styles.input}${errors.root ? ` ${styles.inputError}` : ''}`}
            {...register('password', { required: true, onChange: () => clearErrors('root') })}
          />
        </div>
        {errors.root && <p className={styles.rootError}>{errors.root.message}</p>}
        <button className={styles.submitBtn} type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Вход…' : 'Войти'}
        </button>
      </form>
      <p className={styles.footer}>
        Нет аккаунта?
        <button type="button" className={styles.footerLink} onClick={onSwitch}>
          Зарегистрироваться
        </button>
      </p>
    </div>
  );
}

function RegisterForm({ onSwitch, onSuccess, onClose }) {
  const [shake, setShake] = useState(false);
  const { register, handleSubmit, watch, setError, clearErrors, formState: { errors, isSubmitting } } = useForm({ mode: 'onChange' });
  const password = watch('password');

  async function onSubmit({ displayName, company, email, password: pw }) {
    const code = sessionStorage.getItem(INVITE_CODE_KEY) ?? '';
    let codeOk = false;
    try {
      codeOk = await validateInviteCode(code);
    } catch {
      codeOk = false;
    }
    if (!codeOk) {
      setError('root', { message: 'Нужна ссылка-приглашение. Обратитесь к администратору.' });
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pw);
      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        displayName: displayName.trim(),
        company: company?.trim() ?? '',
        status: 'active',
        role: 'user',
        createdAt: serverTimestamp(),
      });
      onSuccess?.();
    } catch (err) {
      const c = err?.code ?? '';
      let msg = 'Ошибка регистрации. Попробуйте ещё раз.';
      if (c === 'auth/email-already-in-use') msg = 'Этот email уже зарегистрирован.';
      else if (c === 'auth/weak-password')   msg = 'Пароль слишком слабый (минимум 6 символов).';
      else if (c === 'auth/invalid-email')   msg = 'Неверный формат email.';
      setError('root', { message: msg });
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  return (
    <div className={`${styles.card}${shake ? ` ${styles.cardShake}` : ''}`}>
      <button className={styles.closeBtn} type="button" onClick={onClose} aria-label="Закрыть">
        <CloseSvg />
      </button>
      <div className={styles.logo}>
        <img src="/img/brand/logo.svg" alt="Промет" className={styles.logoImg} />
      </div>

      <CardHeader title="Регистрация" subtitle="Конфигуратор шкафов-локеров" />
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="reg-name">ФИО</label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                autoFocus
                disabled={isSubmitting}
                placeholder="Иванов Иван Иванович"
                className={`${styles.input}${errors.displayName ? ` ${styles.inputError}` : ''}`}
                {...register('displayName', {
                  required: 'Введите ФИО',
                  validate: (v) => v.trim().length > 0 || 'Введите ФИО',
                  onChange: () => clearErrors('root'),
                })}
              />
              {errors.displayName && <p className={styles.errorMsg}>{errors.displayName.message}</p>}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="reg-company">Компания</label>
              <input
                id="reg-company"
                type="text"
                autoComplete="organization"
                disabled={isSubmitting}
                placeholder="ООО Ромашка (необязательно)"
                className={styles.input}
                {...register('company', { onChange: () => clearErrors('root') })}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                className={`${styles.input}${errors.email ? ` ${styles.inputError}` : ''}`}
                {...register('email', {
                  required: 'Введите email',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Неверный формат email' },
                  onChange: () => clearErrors('root'),
                })}
              />
              {errors.email && <p className={styles.errorMsg}>{errors.email.message}</p>}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="reg-password">Пароль</label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                className={`${styles.input}${errors.password ? ` ${styles.inputError}` : ''}`}
                {...register('password', {
                  required: 'Введите пароль',
                  minLength: { value: 6, message: 'Минимум 6 символов' },
                  onChange: () => clearErrors('root'),
                })}
              />
              {errors.password && <p className={styles.errorMsg}>{errors.password.message}</p>}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="reg-confirm">Повторите пароль</label>
              <input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                className={`${styles.input}${errors.confirmPassword ? ` ${styles.inputError}` : ''}`}
                {...register('confirmPassword', {
                  required: 'Повторите пароль',
                  validate: (v) => v === password || 'Пароли не совпадают',
                  onChange: () => clearErrors('root'),
                })}
              />
              {errors.confirmPassword && <p className={styles.errorMsg}>{errors.confirmPassword.message}</p>}
            </div>
            {errors.root && <p className={styles.rootError}>{errors.root.message}</p>}
            <button className={styles.submitBtn} type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Регистрация…' : 'Зарегистрироваться'}
            </button>
          </form>
      <p className={styles.footer}>
        Уже есть аккаунт?
        <button type="button" className={styles.footerLink} onClick={onSwitch}>Войти</button>
      </p>
    </div>
  );
}

export default function AuthModal({ open, view = 'login', onClose, onSuccess }) {
  const [currentView, setCurrentView] = useState(view);

  useEffect(() => {
    if (open) setCurrentView(view);
  }, [open, view]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleSuccess = () => {
    onSuccess?.();
    onClose?.();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          >
            {currentView === 'login' ? (
              <LoginForm
                onSwitch={() => setCurrentView('register')}
                onSuccess={handleSuccess}
                onClose={onClose}
              />
            ) : (
              <RegisterForm
                onSwitch={() => setCurrentView('login')}
                onSuccess={handleSuccess}
                onClose={onClose}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
