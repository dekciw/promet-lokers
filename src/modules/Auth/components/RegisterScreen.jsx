import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../../shared/lib/firebase';
import { validateInviteCode } from '../../../shared/hooks/useInviteCode';
import styles from './LoginScreen.module.css';

function useCodeValidation(code) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!code) { setStatus('invalid'); return; }
    let cancelled = false;
    validateInviteCode(code).then((ok) => {
      if (!cancelled) setStatus(ok ? 'valid' : 'invalid');
    }).catch(() => {
      if (!cancelled) setStatus('invalid');
    });
    return () => { cancelled = true; };
  }, [code]);

  return status;
}

export default function RegisterScreen() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') ?? '';
  const codeStatus = useCodeValidation(code);
  const [shake, setShake] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onChange' });

  const password = watch('password');

  async function onSubmit({ displayName, company, email, password: pw }) {
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
    <div className={styles.loginPage}>
      <div className={`${styles.loginCard}${shake ? ` ${styles.loginCardShake}` : ''}`}>
        <div className={styles.loginLogo}>
          <img src="/img/brand/logo.svg" alt="Промет" className={styles.loginLogoImg} />
        </div>

        {codeStatus === 'loading' && (
          <div className={styles.loginHeader}>
            <p className={styles.loginSubtitle}>Проверка ссылки…</p>
          </div>
        )}

        {codeStatus === 'invalid' && (
          <>
            <div className={styles.loginHeader}>
              <h1 className={styles.loginTitle}>Регистрация закрыта</h1>
              <p className={styles.loginSubtitle}>Для регистрации нужна ссылка-приглашение</p>
            </div>
            <p className={`${styles.loginError} ${styles.loginErrorCenter}`}>
              Обратитесь к администратору за ссылкой для регистрации.
            </p>
            <p className={styles.loginFooter}>
              Уже есть аккаунт?
              <Link to="/login" className={styles.loginLink}>Войти</Link>
            </p>
          </>
        )}

        {codeStatus === 'valid' && (
          <>
            <div className={styles.loginHeader}>
              <h1 className={styles.loginTitle}>Регистрация</h1>
              <p className={styles.loginSubtitle}>Конфигуратор шкафов-локеров</p>
            </div>

            <form className={styles.loginForm} onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className={styles.loginField}>
                <label className={styles.loginLabel} htmlFor="reg-name">ФИО</label>
                <input
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  disabled={isSubmitting}
                  className={`${styles.loginInput}${errors.displayName ? ` ${styles.loginInputError}` : ''}`}
                  placeholder="Иванов Иван Иванович"
                  {...register('displayName', {
                    required: 'Введите ФИО',
                    validate: (v) => v.trim().length > 0 || 'Введите ФИО',
                    onChange: () => clearErrors('root'),
                  })}
                />
                {errors.displayName && <p className={styles.loginError}>{errors.displayName.message}</p>}
              </div>

              <div className={styles.loginField}>
                <label className={styles.loginLabel} htmlFor="reg-company">Компания</label>
                <input
                  id="reg-company"
                  type="text"
                  autoComplete="organization"
                  disabled={isSubmitting}
                  className={styles.loginInput}
                  placeholder="ООО Ромашка (необязательно)"
                  {...register('company', { onChange: () => clearErrors('root') })}
                />
              </div>

              <div className={styles.loginField}>
                <label className={styles.loginLabel} htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  className={`${styles.loginInput}${errors.email ? ` ${styles.loginInputError}` : ''}`}
                  {...register('email', {
                    required: 'Введите email',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Неверный формат email' },
                    onChange: () => clearErrors('root'),
                  })}
                />
                {errors.email && <p className={styles.loginError}>{errors.email.message}</p>}
              </div>

              <div className={styles.loginField}>
                <label className={styles.loginLabel} htmlFor="reg-password">Пароль</label>
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className={`${styles.loginInput}${errors.password ? ` ${styles.loginInputError}` : ''}`}
                  {...register('password', {
                    required: 'Введите пароль',
                    minLength: { value: 6, message: 'Минимум 6 символов' },
                    onChange: () => clearErrors('root'),
                  })}
                />
                {errors.password && <p className={styles.loginError}>{errors.password.message}</p>}
              </div>

              <div className={styles.loginField}>
                <label className={styles.loginLabel} htmlFor="reg-confirm">Повторите пароль</label>
                <input
                  id="reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  className={`${styles.loginInput}${errors.confirmPassword ? ` ${styles.loginInputError}` : ''}`}
                  {...register('confirmPassword', {
                    required: 'Повторите пароль',
                    validate: (v) => v === password || 'Пароли не совпадают',
                    onChange: () => clearErrors('root'),
                  })}
                />
                {errors.confirmPassword && <p className={styles.loginError}>{errors.confirmPassword.message}</p>}
              </div>

              {errors.root && (
                <p className={styles.loginError}>{errors.root.message}</p>
              )}

              <button className={styles.loginBtn} type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Регистрация…' : 'Зарегистрироваться'}
              </button>
            </form>

            <p className={styles.loginFooter}>
              Уже есть аккаунт?
              <Link to="/login" className={styles.loginLink}>Войти</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
