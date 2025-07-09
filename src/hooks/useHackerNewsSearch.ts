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

export function useHackerNewsSearch(term: string = ''): [HackerNewsSearchResult, (term: string) => void] {
    const [searchTerm, setSearchTerm] = useState(term);
    const [data, setData] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(false);

    // Update internal search term when prop changes
    useEffect(() => {
        setSearchTerm(term);
    }, [term]);

    useEffect(() => {
        if (searchTerm === '') {
            // If the term is empty, don't make an API call
            return;
        }
        (async () => {
            setHasError(false);
            setIsLoading(true);
            try {
                const url = `${BASE_URL}${searchTerm}`;
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
    }, [searchTerm]);

    function updateSearchTerm(newTerm: string) {
        setSearchTerm(newTerm);
    }

    return [{ data, isLoading, hasError }, updateSearchTerm];
}