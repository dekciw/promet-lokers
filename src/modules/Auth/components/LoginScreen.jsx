import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../shared/lib/firebase';
import { ADMIN_EMAIL } from '../../../shared/constants/admin';
import styles from './LoginScreen.module.css';

const DEACTIVATED_KEY = 'promet_login_deactivated';

export default function LoginScreen() {
  const [shake, setShake] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    const msg = sessionStorage.getItem(DEACTIVATED_KEY);
    if (msg) {
      sessionStorage.removeItem(DEACTIVATED_KEY);
      setError('root', { message: msg });
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }, [setError]);

  async function onSubmit({ email, password }) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      const userSnap = await getDoc(doc(db, 'users', cred.user.uid));
      const isMasterAdmin = cred.user.email === ADMIN_EMAIL;
      if (!isMasterAdmin && (!userSnap.exists() || userSnap.data().status === 'disabled')) {
        sessionStorage.setItem(DEACTIVATED_KEY, 'Аккаунт деактивирован. Обратитесь к администратору.');
        await signOut(auth);
        return;
      }
    } catch {
      setError('root', { message: 'Неверный email или пароль' });
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={`${styles.loginCard} animate__animated animate__fadeInUp${shake ? ` ${styles.loginCardShake}` : ''}`}>
        <div className={styles.loginLogo}>
          <img src='/img/brand/logo.svg' alt='Промет' className={styles.loginLogoImg} />
        </div>

        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Вход в систему</h1>
          <p className={styles.loginSubtitle}>Конфигуратор шкафов-локеров</p>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.loginField}>
            <label className={styles.loginLabel} htmlFor='email'>Email</label>
            <input
              className={`${styles.loginInput}${errors.root ? ` ${styles.loginInputError}` : ''}`}
              id='email'
              type='email'
              autoComplete='email'
              autoFocus
              disabled={isSubmitting}
              {...register('email', { required: true, onChange: () => clearErrors('root') })}
            />
          </div>

          <div className={styles.loginField}>
            <label className={styles.loginLabel} htmlFor='password'>Пароль</label>
            <input
              className={`${styles.loginInput}${errors.root ? ` ${styles.loginInputError}` : ''}`}
              id='password'
              type='password'
              autoComplete='current-password'
              disabled={isSubmitting}
              {...register('password', { required: true, onChange: () => clearErrors('root') })}
            />
          </div>

          {errors.root && (
            <p className={styles.loginError}>{errors.root.message}</p>
          )}

          <button className={styles.loginBtn} type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Вход…' : 'Войти'}
          </button>
        </form>

        <p className={styles.loginFooter}>
          Нет аккаунта?
          <Link to="/register" className={styles.loginLink}>Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}
