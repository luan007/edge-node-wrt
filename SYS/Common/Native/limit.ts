eval(LOG("Common:Native:limit"));

/*Encap Linux Limit mach here*/

/**
 * http://linux.die.net/man/2/setrlimit
 */

/*
 * int prlimit(pid_t pid, int resource, const struct rlimit *new_limit, struct rlimit *old_limit);
 */


/*
 * If the new_limit argument is a not NULL, 
 * then the rlimit structure to which it points is used to 
 * set new values for the soft and hard limits for resource.
 * If the old_limit argument is a not NULL, 
 * then a successful call to prlimit() places the previous soft 
 * and hard limits for resource in the rlimit structure pointed to 
 * by old_limit.
 * 
 */

/*
 * struct rlimit {
 *  rlim_t rlim_cur; //HARD
 *  rlim_t rlim_max; //SOFT
 * };
 */

/***
 * 
 * Use Lib FFI :)
 * 
 */

export function prlimit() {

}


/**
 * https://github.com/opsengine/cpulimit
 * 
 * 
 */

export function CPULimit() { }

//TODO: Finish Linux's LIMIT Support