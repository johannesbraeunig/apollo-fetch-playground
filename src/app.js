import React from "react";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useLazyQuery,
  HttpLink,
  gql,
  NetworkStatus,
} from "@apollo/client";
import { mergeDeepArray } from "@apollo/client/utilities";

import fetch from "cross-fetch";

const client = new ApolloClient({
  link: new HttpLink({ uri: "https://graphqlzero.almansi.me/api", fetch }),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          todos: {
            read(existing = {}) {
              return existing;
            },
            merge(existing = {}, incoming) {
              const existingData = existing?.data || [];
              const incomingData = incoming?.data || [];
              return {
                ...existing,
                ...incoming,
                data: [...existingData, ...incomingData],
              };
            },
          },
        },
      },
    },
  }),
});

export const App = () => (
  <ApolloProvider client={client}>
    <RenderList />
  </ApolloProvider>
);

const LIST = gql`
  query GetTodos($page: Int!, $limit: Int!) {
    todos(options: { paginate: { page: $page, limit: $limit } }) {
      data {
        id
        title
      }
      links {
        next {
          page
        }
      }
    }
  }
`;

export const RenderList = () => {
  const [getList, { data, called, fetchMore, networkStatus }] = useLazyQuery(
    LIST,
    {
      variables: { page: 1, limit: 10 },
      notifyOnNetworkStatusChange: true,
    }
  );
  const todos = data?.todos?.data;
  const nextPage = data?.todos?.links?.next?.page;

  if (!called) {
    return <button onClick={() => getList()}>Call inital list items</button>;
  }

  if (networkStatus === NetworkStatus.loading) {
    return "loading";
  }
  return (
    <div>
      {todos.map((todo) => (
        <div key={todo.id}>{todo.title}</div>
      ))}
      <button onClick={() => fetchMore({ variables: { page: nextPage } })}>
        Fetch More
      </button>
      {networkStatus === NetworkStatus.fetchMore && <p>Loading more...</p>}
    </div>
  );
};
