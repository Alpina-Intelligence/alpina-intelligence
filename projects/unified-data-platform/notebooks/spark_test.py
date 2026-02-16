"""PySpark + Delta Lake local test."""
from delta import configure_spark_with_delta_pip
from pyspark.sql import SparkSession

# Create a local Spark session with Delta Lake support
builder = (
    SparkSession.builder.appName("LocalTest")
    .master("local[*]")
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
    .config(
        "spark.sql.catalog.spark_catalog",
        "org.apache.spark.sql.delta.catalog.DeltaCatalog",
    )
)

spark = configure_spark_with_delta_pip(builder).getOrCreate()

# Create a simple DataFrame
data = [
    ("Alice", 34),
    ("Bob", 45),
    ("Charlie", 29),
]
df = spark.createDataFrame(data, ["name", "age"])

print("=== Spark DataFrame ===")
df.show()

print("=== Schema ===")
df.printSchema()

print("=== Simple aggregation ===")
df.agg({"age": "avg"}).show()

# Test Delta Lake write
print("=== Writing Delta Table ===")
delta_path = "/tmp/delta_spark_test"
df.write.format("delta").mode("overwrite").save(delta_path)
print(f"Wrote Delta table to {delta_path}")

# Read it back
print("=== Reading Delta Table ===")
df_read = spark.read.format("delta").load(delta_path)
df_read.show()

# Show Delta table history
print("=== Delta Table History ===")
from delta.tables import DeltaTable

dt = DeltaTable.forPath(spark, delta_path)
dt.history().show(truncate=False)

spark.stop()
print("\nSpark session closed successfully!")
