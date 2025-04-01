# import json
# import pandas as pd
# import matplotlib.pyplot as plt
# import os

# # Create the results directory if it doesn't exist
# results_dir = 'tests/results'
# os.makedirs(results_dir, exist_ok=True)

# # Set paths for all files
# json_path = os.path.join(results_dir, 'test_results.json')
# csv_path = os.path.join(results_dir, 'test_results_summary.csv')
# html_path = os.path.join(results_dir, 'test_results_summary.html')
# png_path = os.path.join(results_dir, 'test_results_summary.png')

# # This would load the test_results.json from its new location
# # But you'll first need to move it there or update another script to save it there
# try:
#     with open(json_path, 'r') as file:
#         test_results = json.load(file)
# except FileNotFoundError:
#     # Fallback to the old location if it hasn't been moved yet
#     with open('test_results.json', 'r') as file:
#         test_results = json.load(file)
#         # Optionally save to the new location
#         with open(json_path, 'w') as output_file:
#             json.dump(test_results, output_file, indent=4)
#     print(f"Note: test_results.json has been copied to {json_path}")

# # Convert to DataFrame for easier analysis
# df = pd.DataFrame(test_results)

# # Calculate key metrics
# total_tests = len(df)
# passed_tests = df['status'].value_counts().get('Pass', 0)
# failed_tests = df['status'].value_counts().get('Fail', 0)
# accuracy = (passed_tests / total_tests) * 100 if total_tests > 0 else 0

# # Display Summary
# print("\n📊 Test Summary:")
# print(f"Total Tests: {total_tests}")
# print(f"Passed Tests: {passed_tests}")
# print(f"Failed Tests: {failed_tests}")
# print(f"Accuracy: {accuracy:.2f}%\n")

# # Save a summary table
# df.to_csv(csv_path, index=False)
# df.to_html(html_path, index=False)

# # Plot Results
# plt.figure(figsize=(10, 6))
# result_counts = df['status'].value_counts()
# result_counts.plot(kind='bar')

# plt.title('Test Results Summary')
# plt.xlabel('Status')
# plt.ylabel('Number of Tests')
# plt.xticks(rotation=0)

# # Annotate the bars
# for i in range(len(result_counts)):
#     plt.text(i, result_counts[i], str(result_counts[i]), ha='center', va='bottom')

# # Save the plot
# plt.tight_layout()
# plt.savefig(png_path)
# print(f"📈 Graph saved as '{png_path}'.")

# # Show the plot
# plt.show()