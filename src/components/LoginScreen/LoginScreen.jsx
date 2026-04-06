import { useState } from 'react';
import styles from './LoginScreen.module.css';

const LOGIN = 'admin';
const PASSWORD = '1787810';

export default function LoginScreen({ onAuth }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (login === LOGIN && password === PASSWORD) {
      localStorage.setItem('promet_auth', '1');
      onAuth();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  function handleChange(setter) {
    return (e) => {
      setError(false);
      setter(e.target.value);
    };
  }

  return (
    <div className={styles.loginPage}>
      <div className={`${styles.loginCard}${shake ? ` ${styles.loginCardShake}` : ''}`}>
        <div className={styles.loginLogo}>
          <img src='/img/logo.svg' alt='Промет' className={styles.loginLogoImg} />
        </div>

        <div className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Вход в систему</h1>
          <p className={styles.loginSubtitle}>Конфигуратор шкафов-локеров</p>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit} noValidate>
          <div className={styles.loginField}>
            <label className={styles.loginLabel} htmlFor='login'>Логин</label>
            <input
              className={`${styles.loginInput}${error ? ` ${styles.loginInputError}` : ''}`}
              id='login'
              type='text'
              value={login}
              onChange={handleChange(setLogin)}
              autoComplete='username'
              autoFocus
            />
          </div>

          <div className={styles.loginField}>
            <label className={styles.loginLabel} htmlFor='password'>Пароль</label>
            <input
              className={`${styles.loginInput}${error ? ` ${styles.loginInputError}` : ''}`}
              id='password'
              type='password'
              value={password}
              onChange={handleChange(setPassword)}
              autoComplete='current-password'
            />
          </div>

          {error && (
            <p className={styles.loginError}>Неверный логин или пароль</p>
          )}

          <button className={styles.loginBtn} type='submit'>
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
