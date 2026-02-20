import { ReactFlowProvider } from '@xyflow/react'
import GraphEditor from './components/GraphEditor'

export default function App() {
  return (
    <ReactFlowProvider>
      <GraphEditor />
    </ReactFlowProvider>
  )
}
