//
// template-rt.cpp
//

#define _CRT_SECURE_NO_WARNINGS
#include "matm.h"
#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <string.h>
#include <vector>
#include <stdio.h>
#include <stdlib.h>
#include <algorithm>
using namespace std;

int g_width;
int g_height;

struct Ray
{
    vec4 origin;
    vec4 dir;
};

// TODO: add structs for spheres, lights and anything else you may need.
struct Sphere
{
    string name;
    vec3 pos;
    vec3 scale;
    vec3 rgb;
    float Ka, Kd, Ks, Kr;
    float n;
};

struct Light
{
    string name;
    vec3 pos;
    vec3 Irgb;
};

// input variables
vec3    g_ambient;
vec3    g_back;
Sphere  g_sphere[5];
int num_sphere = 0;
Light   g_light[5];
int num_light = 0;
string  g_outputFileName = "output.ppm";

vector<vec4> g_colors;

float g_left;
float g_right;
float g_top;
float g_bottom;
float g_near;


// -------------------------------------------------------------------
// Input file parsing

vec4 toVec4(const string& s1, const string& s2, const string& s3)
{
    stringstream ss(s1 + " " + s2 + " " + s3);
    vec4 result;
    ss >> result.x >> result.y >> result.z;
    result.w = 1.0f;
    return result;
}

float toFloat(const string& s)
{
    stringstream ss(s);
    float f;
    ss >> f;
    return f;
}

void parseLine(const vector<string>& vs)
{
    //TODO: add parsing of NEAR, LEFT, RIGHT, BOTTOM, TOP, SPHERE, LIGHT, BACK, AMBIENT, OUTPUT.
    const int num_labels = 11;
    const string labels[] = { "NEAR", "LEFT", "RIGHT", "BOTTOM", "TOP", "RES", "SPHERE", "LIGHT", "BACK", "AMBIENT", "OUTPUT"};
    unsigned label_id = find( labels, labels + num_labels, vs[0]) - labels;
    switch(label_id){
        case 0:         g_near      = toFloat( vs[1] );         break;
        case 1:         g_left      = toFloat( vs[1] );         break;
        case 2:         g_right     = toFloat( vs[1] );         break;
        case 3:         g_bottom    = toFloat( vs[1] );         break;
        case 4:         g_top       = toFloat( vs[1] );         break;

        case 5:         g_width     = (int)toFloat(vs[1]);
                        g_height    = (int)toFloat(vs[2]);
                        g_colors.resize(g_width * g_height);    break;
        case 6:         // Sphere
                        if (num_sphere == 5){  
                            cout << "Maximum number of sphere is five.\n";
                        } else if (vs.size() != 17){
                            cout << "An SPHERE entry requires 16 inputs. Number of given inputs is " << vs.size() -1 << endl;
                        } else {
                            g_sphere[num_sphere].name   = vs[1];
                            g_sphere[num_sphere].pos    = vec3(toFloat(vs[2]),toFloat(vs[3]),toFloat(vs[4]));
                            g_sphere[num_sphere].scale  = vec3(toFloat(vs[5]),toFloat(vs[6]),toFloat(vs[7]));
                            g_sphere[num_sphere].rgb    = vec3(toFloat(vs[8]),toFloat(vs[9]),toFloat(vs[10]));
                            g_sphere[num_sphere].Ka = toFloat(vs[11]);
                            g_sphere[num_sphere].Kd = toFloat(vs[12]);
                            g_sphere[num_sphere].Ks = toFloat(vs[13]);
                            g_sphere[num_sphere].Kr = toFloat(vs[14]);
                            g_sphere[num_sphere].n  = toFloat(vs[15]);   
                            num_sphere++;
                        }
                        break;
        case 7:
                        if (num_light == 5){  
                            cout << "Maximum number of light is five.\n";
                        } else if (vs.size() != 9){
                            cout << "An LIGHT entry requires 8 inputs. Number of given inputs is " << vs.size() -1 << endl;
                        } else {
                            g_light[num_light].name   = vs[1];
                            g_light[num_light].pos    = vec3(toFloat(vs[2]),toFloat(vs[3]),toFloat(vs[4]));
                            g_light[num_light].Irgb   = vec3(toFloat(vs[5]),toFloat(vs[6]),toFloat(vs[7]));
                            num_light++;
                        }
                        break;
        case 8:         g_back[0]   = toFloat( vs[1] );
                        g_back[1]   = toFloat( vs[2] );
                        g_back[2]   = toFloat( vs[3] );         break;
                            
        case 9:         g_ambient[0] = toFloat( vs[1] );
                        g_ambient[1] = toFloat( vs[2] );
                        g_ambient[2] = toFloat( vs[3] );        break;
        case 10:        g_outputFileName = vs[1];               break;
        
        default:        cout << "Error parsing tag " << label_id << endl;
                        exit(1);                                break;
    }
}

void loadFile(const char* filename)
{
    ifstream is(filename);
    if (is.fail())
    {
        cout << "Could not open file " << filename << endl;
        exit(1);
    }
    string s;
    vector<string> vs;
    while(!is.eof())
    {
        vs.clear();
        getline(is, s);
        istringstream iss(s);
        while (!iss.eof())
        {
            string sub;
            iss >> sub;
            vs.push_back(sub);
        }
        parseLine(vs);
    }
}


// -------------------------------------------------------------------
// Utilities

void setColor(int ix, int iy, const vec4& color)
{
    int iy2 = g_height - iy - 1; // Invert iy coordinate.
    g_colors[iy2 * g_width + ix] = color;
}


// -------------------------------------------------------------------
// Intersection routine

// TODO: add your ray-sphere intersection routine here.


// -------------------------------------------------------------------
// Ray tracing

vec4 trace(const Ray& ray)
{
    // TODO: implement your ray tracing routine here.
    return vec4(0.0f, 0.0f, 0.0f, 1.0f);
}

vec4 getDir(int ix, int iy)
{
    // TODO: modify this. This should return the direction from the origin
    // to pixel (ix, iy), normalized.
    vec4 dir;
    dir = vec4(0.0f, 0.0f, -1.0f, 0.0f);
    return dir;
}

void renderPixel(int ix, int iy)
{
    Ray ray;
    ray.origin = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    ray.dir = getDir(ix, iy);
    vec4 color = trace(ray);
    setColor(ix, iy, color);
}

void render()
{
    for (int iy = 0; iy < g_height; iy++)
        for (int ix = 0; ix < g_width; ix++)
            renderPixel(ix, iy);
}


// -------------------------------------------------------------------
// PPM saving

void savePPM(int Width, int Height, char* fname, unsigned char* pixels) 
{
    FILE *fp;
    const int maxVal=255;

    printf("Saving image %s: %d x %d\n", fname, Width, Height);
    fp = fopen(fname,"wb");
    if (!fp) {
        printf("Unable to open file '%s'\n", fname);
        return;
    }
    fprintf(fp, "P6\n");
    fprintf(fp, "%d %d\n", Width, Height);
    fprintf(fp, "%d\n", maxVal);

    for(int j = 0; j < Height; j++) {
        fwrite(&pixels[j*Width*3], 3, Width, fp);
    }

    fclose(fp);
}

void saveFile()
{
    // Convert color components from floats to unsigned chars.
    // TODO: clamp values if out of range.
    unsigned char* buf = new unsigned char[g_width * g_height * 3];
    for (int y = 0; y < g_height; y++)
        for (int x = 0; x < g_width; x++)
            for (int i = 0; i < 3; i++)
                buf[y*g_width*3+x*3+i] = (unsigned char)(((float*)g_colors[y*g_width+x])[i] * 255.9f);
    
    // TODO: change file name based on input file name.
    char output[50];
    memset(output, '\0', sizeof(output));
    strcpy(output, g_outputFileName.c_str());   // convert std::string to const char* and then to char*
    savePPM(g_width, g_height, output, buf);
    delete[] buf;
}


// -------------------------------------------------------------------
// Main

int main(int argc, char* argv[])
{
    if (argc < 2)
    {
        cout << "Usage: template-rt <input_file.txt>" << endl;
        exit(1);
    }
    loadFile(argv[1]);
    render();
    saveFile();
	return 0;
}

