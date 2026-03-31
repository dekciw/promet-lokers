import './Header.css';

export default function Header() {
	return (
		<header className='header'>
			<div className='brand'>
				<img className='logo' src='/img/logo.svg' alt='Промет' />
				<div className='info'>
					<span className='site-name'>safe.ru</span>
					<span className='tagline'>Калькулятор коррекции цен и передачи локеров</span>
				</div>
			</div>
			<div className='account'>
				<img className='account-icon' src='/img/account.svg' alt='' />
				<span className='account-text'>Личный кабинет</span>
			</div>
		</header>
	);
}
