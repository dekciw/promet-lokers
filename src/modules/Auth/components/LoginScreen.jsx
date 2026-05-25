import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../shared/lib/firebase';
import styles from './LoginScreen.module.css';

export default function LoginScreen() {
  const [shake, setShake] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm();

  async function onSubmit({ email, password }) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
      </div>
    </div>
  );
}
