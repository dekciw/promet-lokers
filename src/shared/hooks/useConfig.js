import { useState } from 'react';

const DEFAULT_THICKNESS = '0.5';

export function useConfig(catalog) {
  const [seriesId, setSeriesId] = useState('');
  const [modelId, setModelId] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  const [bodyThickness, setBodyThickness] = useState(DEFAULT_THICKNESS);
  const [doorThickness, setDoorThickness] = useState(DEFAULT_THICKNESS);
  const [lockId, setLockId] = useState('key_basic');
  const [ventilationType, setVentilationType] = useState(null);
  const [bodyColor, setBodyColor] = useState(null);
  const [doorColor, setDoorColor] = useState(null);
  const [quantity, setQuantity] = useState(10);
  const [isResetting, setIsResetting] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  function applySpecs(specs) {
    setWidth(String(specs.width));
    setHeight(String(specs.height));
    setDepth(String(specs.depth));
    setBodyThickness(String(Number(specs.bodyThickness) || 0.5));
    setDoorThickness(String(Number(specs.doorThickness) || 0.5));
    setLockId(specs.lockId ?? 'key_basic');
  }

  function applyModel(newModelId) {
    setModelId(newModelId);
    if (newModelId && catalog?.models[newModelId]) {
      applySpecs(catalog.models[newModelId].defaultSpecs);
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
    setVentilationType(null);
    setBodyColor(null);
    setDoorColor(null);
  }

  function handleSeriesChange(newSeriesId, onAdvance) {
    setSeriesId(newSeriesId);
    setModelId('');
    clearParams();
    if (onAdvance) onAdvance();
  }

  function handleReset() {
    if (modelId && catalog?.models[modelId]) {
      const specs = catalog.models[modelId].defaultSpecs;
      applySpecs(specs);
      setLockId(specs.lockId ?? 'key_basic');
    } else {
      clearParams();
    }
    setVentilationType(null);
    setBodyColor(null);
    setDoorColor(null);
    setResetKey(k => k + 1);
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
    ventilationType,
    bodyColor,
    doorColor,
    quantity,
  };

  const setters = {
    setSeriesId: handleSeriesChange,
    onModelChange: handleModelChange,
    setWidth,
    setHeight,
    setDepth,
    setBodyThickness,
    setDoorThickness,
    setLockId,
    setVentilationType,
    setBodyColor,
    setDoorColor,
    setQuantity,
    onReset: handleReset,
  };

  return { config, setters, isResetting, resetKey };
}
