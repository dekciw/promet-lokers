export default function Header() {
	return (
		<header className='header'>
			<div className='header__brand'>
				<img className='header__logo' src='/img/logo.svg' alt='Промет' />
				<div className='header__info'>
					<span className='header__site-name'>safe.ru</span>
					<span className='header__tagline'>Калькулятор коррекции цен и передачи локеров</span>
				</div>
			</div>
			<div className='header__account'>
				<img className='header__account-icon' src='/img/account.svg' alt='' />
				<span className='header__account-text'>Личный кабинет</span>
			</div>
		</header>
	);
}
