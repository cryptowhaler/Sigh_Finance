from pprint import pprint

from tabulate import tabulate

from cadCAD.configuration.utils import config_sim, configs_as_dicts
from cadCAD.configuration import Experiment
from cadCAD.engine import ExecutionMode, ExecutionContext
from cadCAD.engine import Executor
from cadCAD import configs
import pandas as pd


# system_params_a = {
#     'add': [10, 10, 10]
# }

system_params_b = {
    'add': [10]
}

initial_state = {
    'a': 0
}

def update_a(params, substep, state_history, previous_state, policy_input, **kwargs):
    from numpy import random
    return 'a', previous_state['a'] + params['add'] * random.rand()

psubs = [
    {
        'policies': {},
        'variables': {
            'a': update_a
        }
    }
]

exp_a = Experiment()

sim_config = config_sim({
    "N": 3,
    "T": range(3),
    "M": system_params_b
})
# print(sim_config)

exp_a.append_configs(
    initial_state = initial_state,
    partial_state_update_blocks = psubs,
    sim_configs = sim_config
)
configs_dict = configs_as_dicts(configs)
print()
pprint(configs_dict)
print()

exec_mode = ExecutionMode()

local_mode_ctx = ExecutionContext(context=exec_mode.local_mode)
simulation = Executor(exec_context=local_mode_ctx, configs=configs)
raw_system_events, tensor_field, sessions = simulation.execute()

df = pd.DataFrame(raw_system_events)
runOne = df[df['run'] == 1] #.head()
runTwo = df[df['run'] == 2] #.head()
runThree = df[df['run'] == 3] #.head()

print('Run one: ')
print(tabulate(runOne, headers='keys', tablefmt='psql'))
print('Run two: ')
print(tabulate(runTwo, headers='keys', tablefmt='psql'))
print('Run three: ')
print(tabulate(runThree, headers='keys', tablefmt='psql'))

