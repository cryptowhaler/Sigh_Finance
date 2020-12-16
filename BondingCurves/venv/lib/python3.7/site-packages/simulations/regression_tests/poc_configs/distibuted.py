from pprint import pprint
import pandas as pd
import dill
from tabulate import tabulate

from cadCAD.configuration.utils import configs_as_objs
from simulations.regression_tests.poc_configs.execs.config1_test import run as executor1
# from simulations.regression_tests.poc_configs.execs.config2_test import run as executor2
from cadCAD import configs


# EXECUTE ON ALL NODES =====================
from simulations.regression_tests.poc_configs.models import config1, config2

def get_filtered_dict(d):
    newDict = {}
    # Iterate over all the items in dictionary and filter items which has even keys
    for k, v in d.items():
       # Check if key is even then add pair to new dictionary
       if k in ['experiment_id', 'simulation_id', 'run_id']:
           newDict[k] = v
    return newDict


# Generate / Map Job
# 1. Entire Config List generated for experiments from incomming trafic
#     1a. Form Conknown: number of pods: 4 - [(job id: 1) ... (job id: 4)]
#     Note: map job_id to config list
# 2. Submit jobs (etcd, mongo)
# 3. K8s Jobs: Spin up containers with job ids as env vars


print()
print("Mapping Jobs on all nodes:")
flattened_dicts = [c.__dict__ for c in configs]

mapped_jobs = []
for i, d in enumerate(flattened_dicts):
    new_d = get_filtered_dict(d)
    new_d['job_id'] = i
    mapped_jobs.append(new_d)

print("Flattened Configuration List")
print(configs)
print()
print("Original Configuration List")
original_configs = configs_as_objs(configs)
print(original_configs)
print()
print("Flattened Configuration Job Map")
pprint(mapped_jobs)
print()

print("Pickling: Configuration")
a = original_configs[0]
# use `dill.dump` to create file
pickled_config = dill.dumps(a)
print(pickled_config)
print()

print("Un-Pickling: Configuration")
# use `dill.load` to load file
unpickled_config = dill.loads(pickled_config)
print(unpickled_config)
print()

print("Pickling: Executor")
# use `dill.dump` to create file
pickled_executor1 = dill.dumps(executor1)
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

# EXECUTE ON CONTAINERS =====================
from cadCAD.engine import ExecutionMode, ExecutionContext, Executor


print("=" * 100)
print("Container:")
# Container:
# 1. get Job Id from evn var
# 2. Execution of which run?


print("Get Job 3:")
job3 = [j for j in mapped_jobs if j['job_id'] is 3][0]
print(job3)
print()

# Selecting Job 3
# Job_id ordered once retrieved
exec_jobs = list(zip(mapped_jobs, configs))
chosen_job3 = [(job, sys_config) for job, sys_config in exec_jobs if str(job) == str(job3)][0]
selected_job = chosen_job3[0]
selected_config = chosen_job3[1]
selected_config_dict = selected_config.__dict__

print("Selected Job 3:")
pprint(chosen_job3)
print()
print(selected_job)
print()
print("from Config List:")
print(get_filtered_dict(selected_config_dict))
print(selected_config)
print()

new_configs = [selected_config]
exec_mode = ExecutionMode()

local_proc_ctx = ExecutionContext(context=exec_mode.local_mode)
run = Executor(exec_context=local_proc_ctx, configs=new_configs)

raw_result, tensor_fields, sessions = run.execute()
result = pd.DataFrame(raw_result)
print(tabulate(result, headers='keys', tablefmt='psql'))
