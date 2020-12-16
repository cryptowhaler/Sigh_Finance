# EXECUTE ON ALL NODES =====================
from pprint import pprint

from cadCAD.configuration.utils import configs_as_objs
from simulations.regression_tests.poc_configs.models import config1, config2
from simulations.regression_tests.poc_configs.models import poc


def get_filtered_dict(d):
    newDict = {}
    # Iterate over all the items in dictionary and filter items which has even keys
    for k, v in d.items():
       # Check if key is even then add pair to new dictionary
       if k in ['experiment_id', 'simulation_id', 'run_id']:
           newDict[k] = v
    return newDict


print("Mapping Jobs on all nodes:")
flattened_dicts = [c.__dict__ for c in poc.configs]
# pprint(flattened_dicts)
# print()

mapped_jobs = []
for i, d in enumerate(flattened_dicts):
    new_d = get_filtered_dict(d)
    new_d['job_id'] = i
    mapped_jobs.append(new_d)

print("Flattened Configuration Job Map")
pprint(mapped_jobs)
print()
print("Flattened Configuration List")
print(poc.configs)
print()
print("Original Configuration List")
original_configs = configs_as_objs(poc.configs)
print(original_configs)
print()
