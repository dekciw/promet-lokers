import { useEffect, useRef } from 'react';

export function useClickOutside(ref, onClickOutside) {
  const mousedownWasOutside = useRef(false);

  useEffect(() => {
    function handleMouseDown(e) {
      mousedownWasOutside.current = !(ref.current && ref.current.contains(e.target));
    }
    function handleClick(e) {
      if (mousedownWasOutside.current && !(ref.current && ref.current.contains(e.target))) {
        onClickOutside();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('click', handleClick);
    };
  }, [ref, onClickOutside]);
}
