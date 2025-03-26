<!-- prettier-ignore-start -->

------------------------------------------------------------------
* Copyright © Written by Yariv Gilad © <https://yarivgilad.com> 
------------------------------------------------------------------

==================================
  ## Custom Hook Challenge 🎉🎉🎉
==================================
In this task you will build a simple UI 
that allows the user to search links on `HackerNews`

An example for searching the API links for the term *redux* would be: 
[https://hn.algolia.com/api/v1/search?query=redux]  

1. Create a custom hook in a separate file called  **useHackerNewsSearch** that  
—--> Accepts any search term string
     will make an HTTP request to this API end-point using fetch or axios

<—-- Returns an object with the following shape 

    ```
    {
      loading : true, //boolean
      failed : false, //boolean
      data: [] // array of results
    }
    ```

2. The *data* array needs to contain objects with the following shape:
   Your custom hook will return a sorted array by the *relevancy_score* key 
   (higher comes first)
   * filter out objects that do not contain a *url* or the *relevancy_score* key

    ```
    {
      objectID, //integer
      title, //string
      url, //string
      relevancy_score //integer
    }
    ```

3.  Write all your code in the useHackerNewsSearch.ts file in the 'hooks' folder
    - Your code will demonstrate the use of your custom hook.
    - It will contain a simple *mini-form* for the search and a *list* to display the results.
    - The form will include a text input and a button.
    - On form submit we will use the search term the user entered, update the list of items with the results. 
    - You also need to display a simple text status for *loading* and *failed* states.


---

Much success!
Yariv

 ,_,
(O,O)
(   )
-"-"---

---------------------------------------------------------------
* Copyright © Written by Yariv Gilad © <https://yarivgilad.com> 
[linkedin](https://www.linkedin.com/in/yarivgilad/)
---------------------------------------------------------------
<!-- prettier-ignore-end -->
