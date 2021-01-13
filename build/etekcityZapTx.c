/*
 *  etekcityZapTx.c:
 *  Etekcity ZAP 5LX 433.92MHz 5 channel outlet controller
 *
 * Requires: wiringPi (http://wiringpi.com)
 * Copyright (c) 2015 http://shaunsbennett.com/piblog
 * 
 * So this was pulled from http://shaunsbennett.com/piblog/?p=142
 * He just has it listed as copyright, nothing open source, so I'm not going to list it as that
 * But I did have to modify it to get it to work
 * 
 * In it, he uses the sizes at 8bit x 12 bit x 4 bit
 * It actually is 10bit x 10 bit x 4 bit
 * The first 10 bits are your specific code
 * The next 10 are for the number of switch (this is consistent)
 * The 4 are for on/off. Also consistent
 * 
 * You can figure your first 10 bit code with 433Utils and RFSniffer
 * Take the decimal number they give you, convert it to binary
 * Pull off the last 14 bits
 * Convert the remaining back to decimal
 * Fill in ADDR_PREAMBLE below with that value
 * 
 * This also switches to GPIO 17, wiringPi's 0 pin
 * This makes it consistent with other 433Mhz wiring
 ***********************************************************************
 */
#define _GNU_SOURCE

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>

#include <wiringPi.h>

#define	BCM_PIN_OUT	17  // GPIO 17
#define	PIN_OUT	BCM_PIN_OUT
//
#define DELAY_PULSE 184
#define DELAY_MAX_WAIT 99
#define DELAY_SYNC 5000


#define ADDR_SETON 3
#define ADDR_SETOFF 12

#define REPEAT_BROADCAST 20

#define CHECK_BIT(var,pos) (((var) & (1<<(pos)))>0)

char *usage = "Usage: etekcityZapTx preamble all|address[1-5] on|off\n"
              "       etekcityZapTx -h";

#define ADDR_LIST_SIZE 5
int ADDR_LIST[] = {339,348,368,464,848};

int ADDR_PREAMBLE;

void doWrite(unsigned int bit,unsigned int howLong)
{
    digitalWrite (PIN_OUT, bit) ;
    delayMicroseconds  (howLong) ;
}

void doBroadcastBit(unsigned int bit)
{
    int delayStart = DELAY_PULSE;
    int delayStop = DELAY_PULSE;
    if (bit == 0)
    {
        delayStop = DELAY_PULSE * 3;
    }
    else
    {
        delayStart = DELAY_PULSE * 3;
    }
    digitalWrite (PIN_OUT, HIGH) ;
    while (delayStart>0)
    {
        delayMicroseconds( (DELAY_MAX_WAIT > delayStart) ? delayStart : DELAY_MAX_WAIT  );
        delayStart-= DELAY_MAX_WAIT;
    }

    digitalWrite (PIN_OUT, LOW) ;
    while (delayStop>0)
    {
        delayMicroseconds( (DELAY_MAX_WAIT > delayStop) ? delayStop : DELAY_MAX_WAIT  );
        delayStop-= DELAY_MAX_WAIT;
    }
}

void doBroadcastValue(unsigned int var, unsigned int bits)
{
    int i;
    for (i=bits-1; i>=0 ; i--)
    {
        doBroadcastBit(CHECK_BIT(var,i));
        //printf ("%d", CHECK_BIT(var,i));
    }
}

void doBroadcastMessage(unsigned int address, unsigned int var)
{
    doBroadcastValue(ADDR_PREAMBLE,10);
    doBroadcastValue(address, 10);
    doBroadcastValue( ( var > 0 ) ? ADDR_SETON : ADDR_SETOFF , 4);
    doBroadcastValue(0,1);
    //printf("\n");
    delayMicroseconds(DELAY_SYNC);
}

int main (int argc, char *argv [])
{

    if (argc < 4)
    {
        fprintf (stderr, "%s\n", usage) ;
        return 1 ;
    }

    if (strcasecmp (argv [1], "-h") == 0)
    {
        printf ("%s\n",  usage) ;
        return 0 ;
    }

    if ( !((strcasecmp (argv [3], "on") == 0) || (strcasecmp (argv [3], "off") == 0)) )
    {
        printf ("%s\n",  usage) ;
        return 0 ;
    }
    int var = (strcasecmp (argv [3], "on") == 0) ? 1 : 0;

    int address;
    if((strcasecmp (argv [2], "all") == 0) )
    {
        argv[2] = "0";
    }
    if ( (sscanf (argv[2], "%i", &address)!=1) || address < 0 || address > 5 )
    {
        printf ("%s\n",  usage) ;
        return 0 ;
    }

    // setup preamble. has to be int
    if (sscanf (argv[1], "%i", &ADDR_PREAMBLE) != 1) {
        printf ("%s\n",  usage) ;
        return 0 ;
    }

	//setup as a non-root user provided the GPIO pins have been exported before-hand using the gpio program. 
    char *command;
    asprintf (&command, "gpio export %d out",PIN_OUT);
    if (system(command) == -1)
    {
        fprintf (stderr, "Unable to setup wiringPi: %s\n", strerror (errno)) ;
        return 1 ;
    }
    free(command);
	
	//setup as a non-root user provided the GPIO pins have been exported before-hand. 
    wiringPiSetupSys();

    int i,j;
    for(j=0; j < ADDR_LIST_SIZE; j++)
    {
        if(address==0 || address==j+1)
        {
            for (i=0; i<REPEAT_BROADCAST ; i++ )
            {
                doBroadcastMessage(ADDR_LIST[j],var);
            }
            printf ("etekcityZapTx=address:%d,command:%s\n", j+1, argv[3]) ;
        }
    }

    return 0 ;
}