import React from 'react';
import { Point, Size } from '../../../core/geometry';
import Element from './../../Element';
import Boundary from '../../geo/Boundary';
import { EditorMode } from '../../../services/EditorService';

class FinalNode extends Element {
  bounds: Boundary = { ...this.bounds, width: 45, height: 45 }

  constructor(public name: string = 'ActionNode', public position: Point, public size: Size) {
    super(name);
  }

  public render(options: any): JSX.Element {
    const { width, height } = { ...this.bounds };

    const { editorMode, hover, interactiveElementIds, interactiveElementsMode, theme, toggleInteractiveElements } = options;

    return (
      <svg id={`class-${this.id}`} width={width} height={height} style={{ overflow: 'visible' }}>
        <rect width="100%" height="100%" fill="none" stroke="none" />
        <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) / 2 - 7.5} stroke="none" fill={
            editorMode === EditorMode.InteractiveElementsView &&
            (hover ||
              interactiveElementIds.has(this.id))
              ? theme.interactiveAreaColor
              : 'black'
          }
        />
        <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) / 2 - 2.5} stroke="black" fill="none" strokeWidth="5" />
      </svg>
    );
  }
}

export default FinalNode;
