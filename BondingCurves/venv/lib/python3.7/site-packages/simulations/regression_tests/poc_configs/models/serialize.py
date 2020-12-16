import dill

from simulations.regression_tests.poc_configs.models import config1, config2
from simulations.regression_tests.poc_configs.models import poc

pickled_experiment = dill.dumps(poc)
# print(poc.configs)
# print(pickled_experiment)
