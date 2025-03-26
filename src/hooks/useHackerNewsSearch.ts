import { useEffect, useState } from "react";

type NewsItem = {
    objectID: string;
    title: string;
    url: string;
}
type HackerNewsSearchResult = {
    data: NewsItem[];
    isLoading: boolean;
    hasError: boolean;
}
const BASE_URL = "https://hn.algolia.com/api/v1/search?query=";

export function useHackerNewsSearch(term: string): [HackerNewsSearchResult, (term: string) => void] {
    const [url, setUrl] = useState(`${BASE_URL}${term}`);
    const [data, setData] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            setHasError(false);
            setIsLoading(true);
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const result = await response.json();
                console.log(result);
                setData(result.hits);
            } catch (error) {
                setHasError(true);
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [url]);

    function setSearchTerm(term: string) {
        setUrl(`${BASE_URL}${term}`);
    }


    return [{ data, isLoading, hasError }, setSearchTerm];
}