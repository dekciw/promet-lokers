import { useEffect } from 'react';

export function useClickOutside(ref, onClickOutside) {
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClickOutside();
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [ref, onClickOutside]);
}
