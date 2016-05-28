//
// template-rt.cpp
//

#define _CRT_SECURE_NO_WARNINGS

// Define constants
#define INT_MAX 2147483647
#define DELTA_T 0.0001
#define NUMBER_OF_REFLECTION 3
#define MAX_NUM_SPHERE 5
#define MAX_NUM_LIGHT 5
// intersection status
#define INTERSECT_NONE    0
#define INTERSECT_SPHERE  1
// ray type
#define TYPE_ORIGINAL_RAY  0
#define TYPE_SHADOW_RAY    1
#define TYPE_REFLECTED_RAY 2

#include "matm.h"
#include <math.h>
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
    int type;  // original ray or shadow ray or reflected ray.
};

// TODO: add structs for spheres, lights and anything else you may need.
struct Sphere
{
    string name;
    vec4 pos;
    mat4 inverseMatrix;
    mat4 scaleMatrix;
    vec3 rgb;
    float Ka, Kd, Ks, Kr;
    float n;
};

struct Light
{
    string name;
    vec4 pos;
    vec3 Irgb;
};

struct Intersection
{
    int type;     // tells us whether the ray intersect with sphere, light source, or nothing
    vec4 point;   // closest point of intersection
    vec4 normal;
    float distance;
    Sphere* sphere;
    Light* light;
};
// parsing input variables
vec3    g_ambient;  // ambient color
vec3    g_back;     // background color
Sphere  g_sphere[5];
Light   g_light[5];
string  g_outputFileName = "output.ppm";

int     num_sphere = 0;
int     num_light = 0;

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

vec4 toVec4(vec3 old)
{
    return vec4(old[0], old[1], old[2], 0.0f);
}

vec3 toVec3(vec4 old)
{
    return vec3(old[0], old[1], old[2]);
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
                        if (num_sphere == MAX_NUM_SPHERE){  
                            cout << "Maximum number of sphere is five.\n";
                        } else if (vs.size() != 17){
                            cout << "An SPHERE entry requires 16 inputs. Number of given inputs is " << vs.size() -1 << endl;
                        } else {
                            g_sphere[num_sphere].name = vs[1];
                            g_sphere[num_sphere].pos  = vec4(toFloat(vs[2]),toFloat(vs[3]),toFloat(vs[4]), 1.0f);
                            g_sphere[num_sphere].rgb  = vec3(toFloat(vs[8]),toFloat(vs[9]),toFloat(vs[10]));
                            g_sphere[num_sphere].Ka = toFloat(vs[11]);
                            g_sphere[num_sphere].Kd = toFloat(vs[12]);
                            g_sphere[num_sphere].Ks = toFloat(vs[13]);
                            g_sphere[num_sphere].Kr = toFloat(vs[14]);
                            g_sphere[num_sphere].n  = toFloat(vs[15]);   
                            g_sphere[num_sphere].scaleMatrix   = Scale(toFloat(vs[5]),toFloat(vs[6]),toFloat(vs[7]));
                            InvertMatrix(g_sphere[num_sphere].scaleMatrix, g_sphere[num_sphere].inverseMatrix);
                            num_sphere++;
                        }
                        break;
        case 7:
                        if (num_light == MAX_NUM_LIGHT){  
                            cout << "Maximum number of light is five.\n";
                        } else if (vs.size() != 9){
                            cout << "An LIGHT entry requires 8 inputs. Number of given inputs is " << vs.size() -1 << endl;
                        } else {
                            g_light[num_light].name   = vs[1];
                            g_light[num_light].pos    = vec4(toFloat(vs[2]),toFloat(vs[3]),toFloat(vs[4]), 1.0f);
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
        
        default:        if(vs[0] == "\n" || vs[0] == "")        break;      // handle blank lines
                        cout << "Error parsing tag " << label_id << endl;
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
Intersection find_closest_intersection(const Ray& ray, Sphere* excluded_sphere=NULL)
{
    Intersection retval;
    retval.type = INTERSECT_NONE;
    Sphere* sphere = g_sphere;
    float min_distance = INT_MAX;
    vec4 min_point = vec4();   // position of closest point
    vec4 min_normal = vec4();   // normal vector of closest point
    int sphere_type = INTERSECT_NONE;
    

    // SPHERE: reverse calculation
    for(int i = 0; i != num_sphere; i++){
        sphere = g_sphere + i;
        if(excluded_sphere == sphere)   continue;

        // inverse matrix multiplication. Transform the coord system such that the sphere is a unit sphere centered at origin
        vec4 dir = sphere->inverseMatrix * ray.dir;  // ray_dir
        vec4 pos = sphere->inverseMatrix * ( ray.origin - sphere->pos); // ray_pos

        // let ax^2 + bx + c
        float a = dot( dir, dir );          //  a = ray_dir * ray_dir
        float b = dot( dir, pos );          //  b = 2 (ray_dir * (ray_pos - sphere_pos))
        float c = dot( pos, pos ) - 1;      //  c = sphere_pos^2 + ray_pos^2 - 2*(sphere_pos * ray_pos) 
        float discriminant = b*b - ( a*c ); //  discriminant b^2 - 4ac

        if(discriminant > 0){       // intersect with two points
            // find the closer point using hit time t
            float t1, t2, t;
            /*
             * hit time "t" validity:
             *  For original rays   : t > 1
             *  For shadow rays     : DELTA_T < t < 1
             *  For reflected rays  : t > 0
             */

            // two solutions 
            t1 = ( - b - sqrt(discriminant) ) / ( a );
            t2 = ( - b + sqrt(discriminant) ) / ( a );

            // determine value of t
            if ( ray.type == TYPE_ORIGINAL_RAY ){
                if ( t2 < 1 )   continue;   // sphere completely outside of view
                if ( t1 < 1 )   t = t2; 
                else            t = t1; 
            } else if ( ray.type == TYPE_SHADOW_RAY ){
                t = t1;
                if ( t <= DELTA_T) 
                    t = t2;
                if ( t <= DELTA_T) 
                    continue;
            } else {    // TYPE_REFLECTED_RAY
                t = t1;
                if ( t <= 0 )
                    t = t2;
                if ( t <= 0 )
                    continue;   
            }

            vec4 point =  ray.origin + t * ray.dir; // intersection of the ray and the sphere
            float dis = length(point - ray.origin); // distance between ray.origin and the intersection point

            // compare with the current cloest point, if any.
            if ( min_distance > dis ){
                retval.type = INTERSECT_SPHERE; 
                retval.sphere = sphere;
                min_distance = dis;
                min_point = point;
                min_normal = normalize( sphere->inverseMatrix * sphere->inverseMatrix * (point - sphere->pos) );
            }
        }
    }

    retval.distance = min_distance;
    retval.point = min_point;
    retval.normal = min_normal;
    return retval;
}

// return pixel color. if the point is in shadow, no contribution from the light source, otherwise(no intersection) pixel color == local illumination (diffuse + specular)
vec3 shadow_ray(Light* light, Intersection& P, const Ray& viewer_ray){
    vec3 color; // return value

    // ray from point P to the light source
    Ray ray;
    ray.origin = P.point;
    ray.dir = normalize( light->pos - P.point );
    ray.type = TYPE_SHADOW_RAY;

    Intersection intersection = find_closest_intersection(ray);

    if (intersection.type != INTERSECT_SPHERE){
        float N_dot_L = dot( P.normal, ray.dir);    
        float R_dot_V = dot( 2*P.normal*N_dot_L - ray.dir,  -viewer_ray.dir);   // R = 2 * N * N_dot_L - L

        // diffuse
        if (N_dot_L > 0)   // if N dot L < 0, then no contribution from diffuse
            color = P.sphere->Kd * light->Irgb * N_dot_L * P.sphere->rgb;
        
        // specular 
        if (R_dot_V > 0)
            color += P.sphere->Ks * light->Irgb * powf(R_dot_V, P.sphere->n);
    }
    return color;
}   
// -------------------------------------------------------------------
// Ray tracing
// implement ray tracing

vec4 trace(const Ray& ray, int reflect_level=0, Sphere* excluded_sphere=NULL)
{
    if ( reflect_level == NUMBER_OF_REFLECTION) 
        return vec4();

    vec3 color_local, color_reflect, color;
    Intersection intersection = find_closest_intersection(ray,excluded_sphere);

    if ( intersection.type == INTERSECT_SPHERE )   {
        // ambient color of the object
        color_local = intersection.sphere->Ka * intersection.sphere->rgb * g_ambient; 

        // casting shadow rays, handle diffuse, specular 
        for(int i = 0; i != num_light; i++){
            color_local += shadow_ray(g_light+i, intersection, ray);
        }
        
        // handle reflection rays
        Ray reflected_ray;
        reflected_ray.origin = intersection.point;
        reflected_ray.dir    = normalize( 2 * intersection.normal * dot(intersection.normal, -ray.dir ) + ray.dir ); // R = 2 * N * N_dot_L - L
        reflected_ray.type   = TYPE_REFLECTED_RAY;
        color_reflect        = intersection.sphere->Kr * toVec3( trace( reflected_ray, reflect_level+1, intersection.sphere ));

    } else if (ray.type == TYPE_ORIGINAL_RAY){     
        color_local = g_back;
    }
    // } else {  // this is TYPE_REFLECTED_RAY
    //     // do nothing.
    // }

    color = color_local + color_reflect;

    // check color pixel overflow. Cap to 1.
    for ( int i = 0; i != 3; i++)   
        if ( color[i] > 1 )
            color[i] = 1;

    return( color );
}


float x_ratio_factor, y_ratio_factor;   // pre calculated value declared as global to avoid redundent calculation per pixel. Values are initiated in render()
vec4 getDir(int ix, int iy)
{
    // TODO: modify this. This should return the direction from the origin
    // to pixel (ix, iy), normalized.
    vec4 dir;
    dir = vec4( g_left + ix * x_ratio_factor, g_bottom + iy * y_ratio_factor, -g_near, 0.0f );
    return normalize(dir);
}

void renderPixel(int ix, int iy)
{
    Ray ray;
    ray.origin = vec4(0.0f, 0.0f, 0.0f, 1.0f);
    ray.dir = getDir(ix, iy);
    ray.type = TYPE_ORIGINAL_RAY;
    vec4 color = trace(ray);
    setColor(ix, iy, color);
}

void render()
{
    x_ratio_factor = ( g_right - g_left ) / g_width;
    y_ratio_factor = ( g_top - g_bottom ) / g_height;
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
    char output[21];
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

