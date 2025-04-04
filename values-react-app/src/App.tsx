import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

// Import actual view components
import { Part1View } from './views/Part1View';

// Placeholder components (will be created later)
// const Part1View = () => <div>Part 1</div> // Remove placeholder
const Part2View = () => <div>Part 2</div>;
const Part3View = () => <div>Part 3</div>;
const Part4View = () => <div>Part 4</div>;
const ReviewView = () => <div>Review</div>;

function App() {
  return (
    <Router>
      {/* Use dynamic viewport height to account for mobile browser UI */}
      <div className="container mx-auto p-4 flex flex-col h-[100dvh] overflow-hidden">
        <h1 className="text-2xl font-bold mb-4 flex-shrink-0">Values Exercise</h1>
        {/* Allow routes view to grow and handle its own overflow if necessary */}
        <div className="flex-grow overflow-auto min-h-0">
          {' '}
          {/* Added min-h-0 */}
          <Routes>
            <Route path="/part1" element={<Part1View />} />
            <Route path="/part2" element={<Part2View />} />
            <Route path="/part3" element={<Part3View />} />
            <Route path="/part4" element={<Part4View />} />
            <Route path="/review" element={<ReviewView />} />
            {/* Default route redirects to part1 */}
            <Route path="*" element={<Navigate to="/part1" replace />} />
          </Routes>
        </div>
        {/* TODO: Add Footer/Undo/Redo buttons later */}
      </div>
    </Router>
  );
}

export default App;
