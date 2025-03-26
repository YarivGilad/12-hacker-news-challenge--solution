import { useRef, useState, FormEvent } from 'react';
import { useHackerNewsSearch } from './hooks/useHackerNewsSearch.ts';
import './App.css'

function App() {
  const [term, setTerm] = useState("react");
  const [{ isLoading, hasError, data }, fetchData] = useHackerNewsSearch("react");
  const input = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (input.current) {
      setTerm(input.current.value);
      fetchData(input.current.value);
      input.current.value = "";
    } else {
      console.log("No input");
    }
  };

  return (
    <div className="App">
      <h1>Hacker News Challenge
        <span role="img" aria-label="confetti">🎉</span>
      </h1>
      <div>

        <form onSubmit={handleSubmit}>
          <input type="text" ref={input} />
          <button>search</button>
        </form>

        {isLoading && <h1>Loading...</h1>}
        {hasError && <h1>Failed...</h1>}
        {data?.length > 0 && (
          <>
            <h2>Results about {term}</h2>
            <ul>
              {data.map(({ objectID, title, url }) => (
                <li key={objectID}>
                  <a href={url} target="_blank">
                    {title}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

export default App
