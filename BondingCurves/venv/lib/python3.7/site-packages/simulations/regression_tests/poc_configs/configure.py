# EXECUTE ON CONTAINERS =====================
import dill
from pprint import pprint

from simulations.regression_tests.poc_configs.models.serialize import pickled_experiment
from simulations.regression_tests.poc_configs.all_nodes import get_filtered_dict, mapped_jobs

poc = dill.loads(pickled_experiment)


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
exec_jobs = list(zip(mapped_jobs, poc.configs))
chosen_job3 = [(job, sys_config) for job, sys_config in exec_jobs if str(job) == str(job3)][0]
selected_job = chosen_job3[0]
selected_config = chosen_job3[1]
selected_config_dict = selected_config.__dict__

print("Flattened Configuration Job Map")
pprint(mapped_jobs)
print()
print("Selected Job 3:")
pprint(chosen_job3)
print()
print(selected_job)
print()
print("from Config List:")
print(get_filtered_dict(selected_config_dict))
print(selected_config)
print()

