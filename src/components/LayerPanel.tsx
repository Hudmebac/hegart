import React, { ChangeEvent } from 'react'; // BlendMode import seems missing, adding it
import { AnimationLayer, BlendMode } from '../types/stickman'; // Adjust path as needed

interface LayerPanelProps {
    layers: AnimationLayer[];
    currentLayerId: string | null;
    onAddLayer: () => void;
    onDeleteLayer: (layerId: string) => void;
    onChangeLayerBlendMode: (layerId: string, blendMode: BlendMode) => void;
    onSelectLayer: (layerId: string) => void; // Added BlendMode import here.
}

const LayerPanel: React.FC<LayerPanelProps> = ({
    layers,
    onChangeLayerBlendMode,
    currentLayerId,
    onAddLayer,
    onDeleteLayer,
    onSelectLayer,
}) => {
    return (
        <div className="layer-panel">
            <h3>Animation Layers</h3>
            <div className="layer-list">
                {layers.map(layer => (
                    <div
                        key={layer.id}
                        className={`layer-item ${layer.id === currentLayerId ? 'selected' : ''}`}
                        onClick={() => onSelectLayer(layer.id)}
                    >
                        <span>{layer.name}</span>
                        <select
                            value={layer.blendMode}
                            onChange={(e) => onChangeLayerBlendMode(layer.id, e.target.value as BlendMode)}
                            onClick={(e) => e.stopPropagation()} // Prevent selecting the layer when clicking the dropdown
                        >
                            <option value="override">Override</option>
                            <option value="additive">Additive</option>
                            <option value="Passthrough">Passthrough</option>
                            <option value="Mask">Mask</option>
                            <option value="Alpha">Alpha</option>
                        </select>
                        {/* TODO: Add visual indicators for opacity, visibility, lock status */}
                    </div>
                ))}
            </div>
            <div className="layer-controls">
                <button onClick={onAddLayer}>Add Layer</button>
                <button
                    onClick={() => {
                        if (currentLayerId) {
                            onDeleteLayer(currentLayerId);
                        }
                    }}
                    disabled={!currentLayerId || layers.length <= 1} // Prevent deleting the last layer
                >
                    Delete Selected
                </button>
            </div>
        </div>
    );
};

export default LayerPanel;