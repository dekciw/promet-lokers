import { useState, useEffect } from 'react';

const DEFAULT_THICKNESS = '0.5';
const STORAGE_KEY = 'promet_config';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitial(key, fallback) {
  return loadSaved()?.[key] ?? fallback;
}

export function useConfig(catalog) {
  const [seriesId, setSeriesId] = useState(() => getInitial('seriesId', ''));
  const [modelId, setModelId] = useState(() => getInitial('modelId', ''));
  const [width, setWidth] = useState(() => getInitial('width', ''));
  const [height, setHeight] = useState(() => getInitial('height', ''));
  const [depth, setDepth] = useState(() => getInitial('depth', ''));
  const [bodyThickness, setBodyThickness] = useState(() => getInitial('bodyThickness', DEFAULT_THICKNESS));
  const [doorThickness, setDoorThickness] = useState(() => getInitial('doorThickness', DEFAULT_THICKNESS));
  const [lockId, setLockId] = useState(() => getInitial('lockId', 'key_basic'));
  const [ventilation, setVentilation] = useState(() => getInitial('ventilation', false));
  const [bodyColor, setBodyColor] = useState(() => getInitial('bodyColor', null));
  const [doorColor, setDoorColor] = useState(() => getInitial('doorColor', null));
  const [quantity, setQuantity] = useState(() => getInitial('quantity', 10));
  const [isResetting, setIsResetting] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  function applyModel(newModelId) {
    setModelId(newModelId);
    if (newModelId && catalog?.models[newModelId]) {
      const specs = catalog.models[newModelId].defaultSpecs;
      setWidth(String(specs.width));
      setHeight(String(specs.height));
      setDepth(String(specs.depth));
      setBodyThickness(specs.bodyThickness);
      setDoorThickness(specs.doorThickness);
    } else {
      setWidth('');
      setHeight('');
      setDepth('');
      setBodyThickness(DEFAULT_THICKNESS);
      setDoorThickness(DEFAULT_THICKNESS);
    }
  }

  function handleModelChange(newModelId) {
    if (modelId && newModelId) {
      setIsResetting(true);
      setTimeout(() => {
        applyModel(newModelId);
        setIsResetting(false);
      }, 330);
    } else {
      applyModel(newModelId);
    }
  }

  function clearParams() {
    setWidth('');
    setHeight('');
    setDepth('');
    setBodyThickness(DEFAULT_THICKNESS);
    setDoorThickness(DEFAULT_THICKNESS);
    setLockId('key_basic');
    setVentilation(false);
    setBodyColor(null);
    setDoorColor(null);
  }

  function handleSeriesChange(newSeriesId) {
    setIsResetting(true);
    setTimeout(() => {
      setSeriesId(newSeriesId);
      setModelId('');
      clearParams();
      setIsResetting(false);
    }, 330);
  }

  function handleReset() {
    setIsResetting(true);
    setTimeout(() => {
      if (modelId && catalog?.models[modelId]) {
        const specs = catalog.models[modelId].defaultSpecs;
        setWidth(String(specs.width));
        setHeight(String(specs.height));
        setDepth(String(specs.depth));
        setBodyThickness(specs.bodyThickness);
        setDoorThickness(specs.doorThickness);
        setLockId(specs.lockId ?? 'key_basic');
        setVentilation(specs.ventilation ?? false);
      } else {
        clearParams();
      }
      setBodyColor(null);
      setDoorColor(null);
      setQuantity(10);
      setResetKey(k => k + 1);
      setIsResetting(false);
    }, 330);
  }

  const config = {
    seriesId,
    modelId,
    width,
    height,
    depth,
    bodyThickness,
    doorThickness,
    lockId,
    ventilation,
    bodyColor,
    doorColor,
    quantity,
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [seriesId, modelId, width, height, depth, bodyThickness, doorThickness, lockId, ventilation, bodyColor, doorColor, quantity]);

  const setters = {
    setSeriesId: handleSeriesChange,
    onModelChange: handleModelChange,
    setWidth,
    setHeight,
    setDepth,
    setBodyThickness,
    setDoorThickness,
    setLockId,
    setVentilation,
    setBodyColor,
    setDoorColor,
    setQuantity,
    onReset: handleReset,
  };

  return { config, setters, isResetting, resetKey };
}
