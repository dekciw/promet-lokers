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
  const [ventilation, setVentilation] = useState(false);
  const [bodyColor, setBodyColor] = useState(null);
  const [doorColor, setDoorColor] = useState(null);
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
    if (!modelId || !catalog?.models[modelId]) return;
    setIsResetting(true);
    setTimeout(() => {
      const specs = catalog.models[modelId].defaultSpecs;
      setWidth(String(specs.width));
      setHeight(String(specs.height));
      setDepth(String(specs.depth));
      setBodyThickness(specs.bodyThickness);
      setDoorThickness(specs.doorThickness);
      setLockId(specs.lockId);
      setVentilation(specs.ventilation ?? false);
      setBodyColor(null);
      setDoorColor(null);
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
    setVentilation,
    setBodyColor,
    setDoorColor,
    onReset: handleReset,
  };

  return { config, setters, isResetting, resetKey };
}
