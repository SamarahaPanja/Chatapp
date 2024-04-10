import { useState } from 'react';
import './App.css';
//import { div } from 'three/examples/jsm/nodes/Nodes.js';

// const Person = (props) => {
//   return(
//     <>
//     <h1>First Name: {props.name}</h1>
//     <h1>Last Name: Pal</h1>
//     <h1>Age: 30</h1>
//     </>
//   )
// }

const App = () => {
  //const name = "Sutanjoy"
  const [counter , setCounter] = useState(0);

  return (
    // <div className="App">
    //   <Person name={"Konichiwa"}/>
    //   <h1>Hello, {name}!</h1>
    //   <h2>{321*261}</h2>
    //   {
    //     !name ? (
    //       <>test</>
    //     ) : (
    //       <>
    //       <h1>TEST</h1>
    //       <h2>TEST2</h2>
    //       </>
          
    //     )
    //   }

    // </div>

    <div className='App'>
      <button onClick={() => setCounter((prevCount) => prevCount-1)}>-</button>
      <h1>{counter}</h1>
      <button onClick={() => setCounter((prevCount) => prevCount+1)}>+</button>
    </div>
  );
}

export default App;
