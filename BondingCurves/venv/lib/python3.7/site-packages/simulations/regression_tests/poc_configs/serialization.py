from pprint import pprint

import dill
import pandas as pd
from tabulate import tabulate

from simulations.regression_tests.poc_configs.all_nodes import original_configs
from simulations.regression_tests.poc_configs.execs.config1_test import run as executor1
from simulations.regression_tests.poc_configs.execs.config2_test import run as executor2

print("Pickling: Configuration")
# a = original_configs[0]
# use `dill.dump` to create file
pickled_config = dill.dumps(original_configs)
print(pickled_config)
print()

print("Un-Pickling: Configuration")
# use `dill.load` to load file
unpickled_config = dill.loads(pickled_config)
pprint(unpickled_config)
print()

print("Pickling: Executor")
# use `dill.dump` to create file
pickled_executor1 = dill.dumps(executor1)
pickled_executor2 = dill.dumps(executor2)
print(pickled_executor1)
print()

print("Un-Pickling: Executor")
# use `dill.load` to load file
unpickled_executor1 = dill.loads(pickled_executor1)
print(unpickled_executor1)
print()

# raw_result, tensor_fields, sessions = unpickled_executor1.execute()
# result = pd.DataFrame(raw_result)
# print(tabulate(result, headers='keys', tablefmt='psql'))

# exit()