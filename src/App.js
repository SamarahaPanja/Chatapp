
import './App.css';

const Person = (props) => {
  return(
    <>
    <h1>First Name: {props.name}</h1>
    <h1>Last Name: Pal</h1>
    <h1>Age: 30</h1>
    </>
  )
}

const App = () => {
  const name = "Sutanjoy"

  return (
    <div className="App">
      <Person name={"Konichiwa"}/>
      <h1>Hello, {name}!</h1>
      <h2>{321*261}</h2>
      {
        !name ? (
          <>test</>
        ) : (
          <>
          <h1>TEST</h1>
          <h2>TEST2</h2>
          </>
          
        )
      }

    </div>
  );
}

export default App;
