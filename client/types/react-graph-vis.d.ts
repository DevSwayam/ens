declare module 'react-graph-vis' {
  import { Component } from 'react'

  export interface GraphData {
    nodes: any[]
    edges: any[]
  }

  export interface GraphEvents {
    select?: (event: { nodes: string[]; edges: string[] }) => void
    click?: (event: any) => void
    doubleClick?: (event: any) => void
    hoverNode?: (event: any) => void
    blurNode?: (event: any) => void
    hoverEdge?: (event: any) => void
    blurEdge?: (event: any) => void
    stabilized?: () => void
    afterDrawing?: (ctx: CanvasRenderingContext2D) => void
  }

  export interface GraphProps {
    graph: GraphData
    options?: any
    events?: GraphEvents
    getNetwork?: (network: any) => void
    style?: React.CSSProperties
  }

  export default class Graph extends Component<GraphProps> {}
}
