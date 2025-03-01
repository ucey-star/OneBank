import json
import pandas as pd
import matplotlib.pyplot as plt

# Load test results from JSON
with open('test_results.json', 'r') as file:
    test_results = json.load(file)

# Convert to DataFrame for easier analysis
df = pd.DataFrame(test_results)

# Calculate key metrics
total_tests = len(df)
passed_tests = df['status'].value_counts().get('Pass', 0)
failed_tests = df['status'].value_counts().get('Fail', 0)
accuracy = (passed_tests / total_tests) * 100 if total_tests > 0 else 0

# Display Summary
print("\n📊 Test Summary:")
print(f"Total Tests: {total_tests}")
print(f"Passed Tests: {passed_tests}")
print(f"Failed Tests: {failed_tests}")
print(f"Accuracy: {accuracy:.2f}%\n")

# Save a summary table
df.to_csv('test_results_summary.csv', index=False)
df.to_html('test_results_summary.html', index=False)

# Plot Results
plt.figure(figsize=(10, 6))
result_counts = df['status'].value_counts()
result_counts.plot(kind='bar')

plt.title('Test Results Summary')
plt.xlabel('Status')
plt.ylabel('Number of Tests')
plt.xticks(rotation=0)

# Annotate the bars
for i in range(len(result_counts)):
    plt.text(i, result_counts[i], str(result_counts[i]), ha='center', va='bottom')

# Save the plot
plt.tight_layout()
plt.savefig('test_results_summary.png')
print("📈 Graph saved as 'test_results_summary.png'.")

# Show the plot
plt.show()
