#!/bin/bash

trap 'echo Process interrupted; kill -INT $pid; exit' INT

> results_temp.txt
echo "Query execution time,CPU load,Memory usage,#Results,HTTP requests" > results_temp.csv

exec 3< "C:/Users/thoma/Documents/Master/Masterproef/Implementatie/experiments/ldbc-snb-decentralized/experiment_queries.txt"

query_counter=0
person_amounts=(10 100 500 1000 2000 3500)
probabilities=(0.001 0.01 0.016)
iterations=3

while read -u 3; do
  query=$REPLY
  ((query_counter++))
  suffix=""
  ((query_counter >= 13 && query_counter <= 15)) && suffix="_locations"
  echo -e "Query $query_counter\n|" | tee -a results_temp.txt
  for amount in "${person_amounts[@]}"; do
    echo -e "|\t$amount persons\n|\t|" | tee -a results_temp.txt
    for probability in "${probabilities[@]}"; do
      echo -e "|\t|\tFalse positive probability $probability\n|\t|\t|" | tee -a results_temp.txt
      echo "Query $query_counter - $amount persons - probability $probability" >> results_temp.csv
      for ((i=1;i<=$iterations;i++)); do
        echo -e "|\t|\t|\tIteration $i\n|\t|\t|" | tee -a results_temp.txt

        # Execute process in background, that way the timeout process including its child process can be interrupted using a trap
        timeout -s 1 5m bash -c "node experiment $amount$suffix $probability '$query' 2>&1 | tee -a results_temp.txt | tr -dc '0-9.\n' | tr '\n' ',' | sed 's/,,$//' >> results_temp.csv; echo >> results_temp.csv" &
        pid=$!
        wait $pid

      done
    done
  done
done