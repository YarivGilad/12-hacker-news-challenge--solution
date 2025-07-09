import { useEffect, useState } from "react";

type NewsItem = {
    objectID: string;
    title: string;
    url: string;
    relevancy_score: number;
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
        if (!searchTerm || searchTerm === '') {
            // If the term is empty, undefined, or null, don't make an API call
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
                
                // Check if the response has hits property
                if (!result.hits || !Array.isArray(result.hits)) {
                    throw new Error('Invalid API response: missing hits property');
                }
                
                // Filter out items without url or relevancy_score, transform to expected structure, and sort
                const filteredAndTransformedData = result.hits
                    .filter((item: any) => item.url && typeof item.relevancy_score === 'number')
                    .map((item: any) => ({
                        objectID: item.objectID,
                        title: item.title,
                        url: item.url,
                        relevancy_score: item.relevancy_score
                    }))
                    .sort((a: NewsItem, b: NewsItem) => b.relevancy_score - a.relevancy_score);
                
                setData(filteredAndTransformedData);
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